'use client';

import { useState, useEffect } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { formatEther } from 'viem';
import { escrowABI } from '../constants/abi';
import { Loader2, Tag, Wallet } from 'lucide-react';

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
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 transition-all duration-300 hover:scale-105 hover:border-purple-500/50 group flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div className="bg-purple-500/10 text-purple-400 p-2 rounded-lg">
          <Tag size={20} />
        </div>
        <span className="text-gray-500 font-bold text-[10px] tracking-widest uppercase">ID: #{Number(listing.id)}</span>
      </div>

      <div className="flex-1">
        <h3 className="text-xl font-bold text-white mb-2">{itemTitle}</h3>
        <p className="text-gray-400 text-xs font-medium line-clamp-1">
          Satıcı: {listing.seller.slice(0, 6)}...{listing.seller.slice(-4)}
          {isSeller && <span className="ml-2 text-purple-500 font-bold">(Siz)</span>}
        </p>
      </div>

      <div className="mt-8 space-y-6">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-black text-white">{formatEther(listing.price)}</span>
          <span className="text-purple-500 font-bold text-sm">MON</span>
        </div>
        
        <button
          onClick={handleBuy}
          disabled={isPending || isConfirming || isSuccess || isSeller}
          className={`w-full py-4 rounded-lg font-bold text-white flex items-center justify-center gap-2 transition-all duration-300 group-hover:scale-[1.02] active:scale-95 ${
            isSeller 
              ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-50' 
              : 'btn-gradient'
          }`}
        >
          {isPending || isConfirming ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            <Wallet size={18} />
          )}
          {isSeller ? 'Kendi Ürününüz' : isSuccess ? 'Satın Alındı' : isPending ? 'Cüzdan Bekleniyor' : isConfirming ? 'Onaylanıyor' : 'Hemen Satın Al'}
        </button>
      </div>
    </div>
  );
}
