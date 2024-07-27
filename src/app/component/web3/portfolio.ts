import { Connection, PublicKey, StakeProgram } from "@solana/web3.js";
import axios from 'axios';
import { programs } from '@metaplex/js';
const { metadata: { Metadata } } = programs;
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";


const STAKE_PROGRAM_ID = new PublicKey('Stake11111111111111111111111111111111111111');
const SOLANA_MAINNET = 'https://mainnet.helius-rpc.com/?api-key=4c4a4f43-145d-4406-b89c-36ad977bb738';
const SOLANA_USD_API = 'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd';

const connection = new Connection(SOLANA_MAINNET);

export async function getSolBalance(address: PublicKey, conn: Connection) {
    const balance = await connection.getBalance(address);
    return balance / 1e9; // Convert lamports to SOL (1 SOL = 10^9 lamports)
}

export async function getSolPriceInUSD() {
    try {
        const response = await axios.get(SOLANA_USD_API);
        return response.data.solana.usd;
    } catch (error) {
        console.error('Error fetching SOL price:', error);
        throw error;
    }
}

// async function getTotalWalletValueInUSD() {
//     try {
//         const solPriceInUSD = await getSolPriceInUSD();
//         const walletBalanceInSol = await walletBalanceInSol();
//         return solPriceInUSD * walletBalanceInSol;
//     } catch (error) {
//         console.error('Error calculating total wallet value:', error);
//         throw error;
//     }
// }




export async function getTokenAccounts(walletAddress: PublicKey, conn: Connection) {
    try {
        const tokenAccounts = await connection.getTokenAccountsByOwner(walletAddress, { programId: TOKEN_PROGRAM_ID });
        return tokenAccounts.value.map(({ pubkey, account }) => ({
            address: pubkey.toBase58(),
            balance: account.lamports / 1e9 // Convert lamports to SOL
        }));
    } catch (error) {
        console.error('Error fetching token accounts:', error);
        throw error;
    }
}

export async function getStakeAccounts(walletAddress: PublicKey, conn: Connection) {
    try {
        const stakeAccounts = await connection.getParsedProgramAccounts(STAKE_PROGRAM_ID, {
            filters: [
                { dataSize: 200 }, // Filter by stake account data size
                { memcmp: { offset: 0, bytes: walletAddress.toBase58() } } // Filter by owner
            ]
        });
        return stakeAccounts.map(account => ({
            address: account.pubkey.toBase58(),
            balance: account.account.lamports / 1e9 // Convert lamports to SOL
        }));
    } catch (error) {
        console.error('Error fetching stake accounts:', error);
        throw error;
    }
}