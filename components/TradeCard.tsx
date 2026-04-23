'use client';

import { useState, useEffect } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { formatEther } from 'viem';
import { escrowABI } from '../constants/abi';
import { Loader2, PackageCheck, ShieldCheck, CheckCircle2 } from 'lucide-react';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_ESCROW_ADDRESS as `0x${string}`;

export function TradeCard({ listing, onRefresh }: { listing: any, onRefresh: () => void }) {
  const [pin, setPin] = useState('');
  const { address } = useAccount();
  
  const { data: hash, writeContract, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

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

  const isBuyer = address?.toLowerCase() === listing.buyer?.toLowerCase();
  const isSeller = address?.toLowerCase() === listing.seller?.toLowerCase();

  const handleConfirm = () => {
    if (!pin) return;
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: escrowABI,
      functionName: 'confirmDelivery',
      args: [listing.id, BigInt(pin)],
    });
  };

  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 flex flex-col gap-6 relative overflow-hidden transition-all duration-300 hover:border-purple-500/30">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-purple-600/20 text-purple-400 p-2.5 rounded-xl">
            <PackageCheck size={22} />
          </div>
          <div>
            <h4 className="text-white font-bold text-sm line-clamp-1">{itemTitle}</h4>
            <span className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">ID: #{Number(listing.id)}</span>
          </div>
        </div>
        <div className="bg-purple-600/10 border border-purple-500/20 px-3 py-1 rounded-full shrink-0">
          <span className="text-[10px] font-black text-purple-400 uppercase">LOCKED</span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-end">
          <div>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Tutar</p>
            <p className="text-2xl font-black text-white">{formatEther(listing.price)} MON</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Rolünüz</p>
            <p className={`text-sm font-black ${isBuyer ? 'text-blue-400' : isSeller ? 'text-green-400' : 'text-gray-400'}`}>
              {isBuyer ? 'ALICI' : isSeller ? 'SATICI' : 'İZLEYİCİ'}
            </p>
          </div>
        </div>
      </div>

      {isBuyer && !isSuccess && (
        <div className="space-y-4 pt-4 border-t border-white/5">
          <p className="text-xs font-bold text-gray-400">Onay Kodu (PIN)</p>
          <div className="flex gap-2">
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="******"
              className="flex-1 bg-black/50 border border-white/10 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-center tracking-[0.5em] font-bold"
            />
            <button
              onClick={handleConfirm}
              disabled={isPending || isConfirming || pin.length < 6}
              className="btn-gradient px-6 py-3 rounded-lg font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isPending || isConfirming && <Loader2 className="animate-spin" size={18} />}
              Onayla
            </button>
          </div>
        </div>
      )}

      {isSeller && !isSuccess && (
        <div className="flex items-start gap-3 bg-purple-600/5 p-4 rounded-xl border border-purple-500/10">
          <ShieldCheck className="text-purple-400 shrink-0" size={20} />
          <p className="text-[11px] font-medium text-gray-400 leading-relaxed">
            Ürünü teslim ettikten sonra PIN kodunu alıcıya iletin. Alıcı onayladığında tutar hesabınıza geçecektir.
          </p>
        </div>
      )}

      {isSuccess && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-xl flex items-center justify-center gap-2 animate-in zoom-in-95">
          <CheckCircle2 size={20} />
          <span className="text-sm font-bold uppercase tracking-widest">Tamamlandı</span>
        </div>
      )}
    </div>
  );
}
