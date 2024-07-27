import { Connection, PublicKey, ParsedTransactionWithMeta, ParsedInstruction, PartiallyDecodedInstruction } from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';

export interface SimplifiedTransactionDetail {
  message: string;
  status: 'success' | 'failure';
  signature: string;
  date: string;
}

export const useFetchTransactions = () => {
  const { publicKey } = useWallet();

  const parseTransaction = (tx: ParsedTransactionWithMeta): string => {
    const instructions = tx.transaction.message.instructions;
    const userPubkey = publicKey?.toBase58();

    let operations = new Set<string>();
    let involvedPrograms = new Set<string>();

    const parseTokenTransfer = (ix: ParsedInstruction) => {
      if (ix.parsed.info.source === userPubkey) {
        operations.add('send');
      } else if (ix.parsed.info.destination === userPubkey) {
        operations.add('receive');
      }
    };

    const parseSystemTransfer = (ix: ParsedInstruction) => {
      if (ix.parsed.info.source === userPubkey) {
        operations.add('send');
      } else if (ix.parsed.info.destination === userPubkey) {
        operations.add('receive');
      }
    };

    for (const ix of instructions) {
      if ('programId' in ix) {
        involvedPrograms.add(ix.programId.toBase58());
      }

      if ('parsed' in ix) {
        if (ix.program === 'spl-token') {
          if (['transfer', 'transferChecked'].includes(ix.parsed.type)) {
            parseTokenTransfer(ix);
          }
        } else if (ix.program === 'system') {
          if (ix.parsed.type === 'transfer') {
            parseSystemTransfer(ix);
          }
        }
      } else if ('data' in ix) {
        // Handle partially decoded instructions
        const decodedIx = ix as PartiallyDecodedInstruction;
        // Add logic here to handle specific program instructions if needed
      }
    }

    // Check for known swap program IDs
    const knownSwapPrograms = [
      'JUP4Fb2cqiRUcaTHdrPC8h2gNsA2ETXiPDD33WcGuJB', // Jupiter
      '9W959DqEETiGZocYWCQPaJ6sBmUzgfxXfqGeTEdp3aQP', // Orca
      'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc', // Whirlpool
      // Add more swap program IDs as needed
    ];

    if (knownSwapPrograms.some(program => involvedPrograms.has(program))) {
      operations.add('swap');
    }

    // Prioritize categorization
    if (operations.has('swap')) {
      return "Swapped";
    } else if (operations.has('send') && operations.has('receive')) {
      return "Swapped"; // Many DEX swaps appear as a send and receive
    } else if (operations.has('send')) {
      return "Sent";
    } else if (operations.has('receive')) {
      return "Received";
    } else {
      // Check for other common Solana programs
      if (involvedPrograms.has('ComputeBudget111111111111111111111111111111')) {
        return "App Integration"; // Changed from "Compute Budget" to "App Integration"
      } else if (involvedPrograms.has('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')) {
        return "App Integration"; // Changed from "Token Program Interaction" to "App Integration"
      } else if (involvedPrograms.has('11111111111111111111111111111111')) {
        return "App Integration"; // Changed from "System Program Interaction" to "App Integration"
      } else {
        return "App Integration";
      }
    }
  };

  const fetchTransactions = async (
    connection: Connection,
    limit: number = 10
  ): Promise<SimplifiedTransactionDetail[]> => {
    if (!publicKey) {
      throw new Error("Wallet not connected");
    }

    try {
      const signatures = await connection.getSignaturesForAddress(publicKey, { limit });
      const transactions: SimplifiedTransactionDetail[] = [];

      for (const { signature, slot, err } of signatures) {
        const tx = await connection.getParsedTransaction(signature, { maxSupportedTransactionVersion: 0 });

        if (tx) {
          const message = parseTransaction(tx);
          
          const timestamp = await connection.getBlockTime(slot) ?? 0;
          const date = new Date(timestamp * 1000).toLocaleDateString();

          transactions.push({
            message,
            status: err ? 'failure' : 'success',
            signature,
            date
          });
        }
      }

      return transactions;
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
      throw error;
    }
  };

  return fetchTransactions;
};