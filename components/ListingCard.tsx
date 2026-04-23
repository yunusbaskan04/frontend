'use client';

import { useState, useEffect } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { formatEther } from 'viem';
import { escrowABI } from '../constants/abi';
import { Loader2, Tag, Wallet, Smartphone, ShieldCheck } from 'lucide-react';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_ESCROW_ADDRESS as `0x${string}`;

export function ListingCard({ listing, onRefresh }: { listing: any, onRefresh: () => void }) {
  const { address } = useAccount();
  const { data: hash, writeContract, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const isSeller = address?.toLowerCase() === listing.seller?.toLowerCase();
  
  const [itemTitle, setItemTitle] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('garantor_item_' + Number(listing.id));
      setItemTitle(stored || `Garantör Güvenceli Ürün #${Number(listing.id)}`);
    }
  }, [listing.id]);

  useEffect(() => {
    if (isSuccess) {
      onRefresh();
    }
  }, [isSuccess, onRefresh]);

  const handleBuy = () => {
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: escrowABI,
      functionName: 'buyItem',
      args: [listing.id],
      value: listing.price,
    });
  };

  return (
    <div className="bg-white/[0.02] border border-purple-500/30 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-2 hover:border-purple-500 flex flex-col h-full relative overflow-hidden group">
      {/* Top Section */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-purple-500/20 text-purple-400 p-2 rounded-xl">
            <Smartphone size={20} />
          </div>
          <div className="flex flex-col">
            <h3 className="text-white font-bold text-sm line-clamp-1">{itemTitle}</h3>
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">MARKA / MODEL</span>
          </div>
        </div>
        <div className="bg-green-500/10 text-green-500 text-[10px] font-black px-2 py-1 rounded border border-green-500/20 uppercase tracking-widest">
          SATIŞTA
        </div>
      </div>

      {/* Middle Section */}
      <div className="py-4 border-t border-purple-500/20 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">SATICI</span>
          <span className="text-xs text-gray-300 font-mono">
            {listing.seller.slice(0, 6)}...{listing.seller.slice(-4)}
          </span>
        </div>
        <div className="flex items-center gap-1.5 bg-purple-500/5 px-2 py-1 rounded-md border border-purple-500/10">
          <ShieldCheck size={12} className="text-purple-400" />
          <span className="text-[10px] font-bold text-purple-300">Escrow</span>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="mt-auto pt-6 flex items-center justify-between gap-4">
        <div className="flex flex-col">
          <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">FİYAT</span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-white">{formatEther(listing.price)}</span>
            <span className="text-purple-500 font-bold text-[10px]">MON</span>
          </div>
        </div>
        
        <button
          onClick={handleBuy}
          disabled={isPending || isConfirming || isSuccess || isSeller}
          className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest text-white transition-all duration-300 flex items-center justify-center gap-2 ${
            isSeller 
              ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
              : 'bg-purple-600 hover:bg-purple-500 shadow-lg shadow-purple-600/20'
          }`}
        >
          {isPending || isConfirming ? (
            <Loader2 className="animate-spin" size={16} />
          ) : (
            <Wallet size={14} />
          )}
          {isSeller ? 'Sizin İlanınız' : isSuccess ? 'Alındı' : 'Satın Al'}
        </button>
      </div>
    </div>
  );
}
