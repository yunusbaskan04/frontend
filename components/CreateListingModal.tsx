'use client';

import { useState, useEffect } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { escrowABI } from '../constants/abi';
import { Loader2, X, Info } from 'lucide-react';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_ESCROW_ADDRESS as `0x${string}`;

export function CreateListingModal({ isOpen, onClose, onRefresh, nextId }: { isOpen: boolean, onClose: () => void, onRefresh: () => void, nextId: number }) {
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [pin, setPin] = useState('');

  const { data: hash, writeContract, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (isSuccess) {
      // Save title to localStorage using the next ID
      if (title) {
        localStorage.setItem('garantor_item_' + nextId, title);
      }
      onRefresh(); // Trigger refetch
      setTimeout(() => {
        onClose();
        setTitle('');
        setPrice('');
        setPin('');
      }, 1500);
    }
  }, [isSuccess, onClose, onRefresh, nextId, title]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!price || !pin) return;

    writeContract({
      address: CONTRACT_ADDRESS,
      abi: escrowABI,
      functionName: 'createListing',
      args: [priceWei(), BigInt(pin)],
      value: depositWei(),
    });
  };

  const priceWei = () => price ? parseEther(price) : 0n;
  const depositWei = () => (priceWei() * 10n) / 100n;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-gray-900/90 border border-white/10 w-full max-w-md rounded-2xl p-8 relative shadow-2xl backdrop-blur-xl animate-in zoom-in-95 duration-300">
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors"
          disabled={isPending || isConfirming}
        >
          <X size={24} />
        </button>

        <h2 className="text-3xl font-black text-white mb-2">İlan Oluştur</h2>
        <p className="text-gray-400 text-sm mb-8">Ürün detaylarını girin ve satışı başlatın.</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Ürün Adı</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Örn: Monad T-Shirt"
              className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-white text-lg font-bold"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Fiyat (MON)</label>
            <input
              type="number"
              step="0.000001"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
              className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-white text-lg font-bold"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Güvenlik PIN Kodu</label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="******"
              className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-white text-xl font-bold tracking-[0.5em] text-center"
              required
            />
          </div>

          <div className="bg-purple-600/5 border border-purple-500/10 p-4 rounded-xl flex gap-3 items-start">
            <Info className="text-purple-400 shrink-0 mt-0.5" size={18} />
            <p className="text-[11px] text-gray-400 leading-relaxed font-medium">
              Satıcı depozitosu: <span className="text-white font-bold">{(Number(price) * 0.1).toFixed(4)} MON</span> (%10). 
              Bu tutar işlem başarıyla bittiğinde cüzdanınıza iade edilir.
            </p>
          </div>

          <button
            type="submit"
            disabled={isPending || isConfirming || isSuccess}
            className="w-full btn-gradient py-5 rounded-xl font-black text-white text-lg shadow-xl shadow-purple-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] flex items-center justify-center gap-3"
          >
            {isPending || isConfirming ? <Loader2 className="animate-spin" size={24} /> : null}
            {isSuccess ? 'İlan Başarıyla Yayınlandı' : isPending ? 'Cüzdan Onayı...' : isConfirming ? 'Ağda Onaylanıyor...' : 'İlanı Yayınla'}
          </button>

          {error && (
            <p className="text-red-400 text-[10px] text-center font-bold uppercase tracking-wider bg-red-500/5 p-2 rounded-lg border border-red-500/10">
              Hata: {error.message.includes('User rejected') ? 'İşlem İptal Edildi' : 'Bir Hata Oluştu'}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
