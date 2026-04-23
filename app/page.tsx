'use client';

import { useState, useEffect, useMemo } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useReadContract, useReadContracts, useAccount } from 'wagmi';
import { escrowABI } from '../constants/abi';
import { CreateListingModal } from '../components/CreateListingModal';
import { ListingCard } from '../components/ListingCard';
import { TradeCard } from '../components/TradeCard';
import { LayoutGrid, ClipboardList, RefreshCw, Loader2, Zap, ShieldCheck, Package } from 'lucide-react';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_ESCROW_ADDRESS as `0x${string}`;

export default function Home() {
  const [activeTab, setActiveTab] = useState<'marketplace' | 'my-trades'>('marketplace');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { address } = useAccount();

  // 1. Get total listings count
  const { data: nextId, refetch: refetchNextId } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: escrowABI,
    functionName: 'nextListingId',
  });

  const totalListings = nextId ? Number(nextId) : 0;

  // 2. Prepare calls for all listings (Memoized to prevent flickering)
  const listingCalls = useMemo(() => {
    return Array.from({ length: totalListings }, (_, i) => ({
      address: CONTRACT_ADDRESS,
      abi: escrowABI,
      functionName: 'listings',
      args: [BigInt(i)],
    }));
  }, [totalListings]);

  // 3. Fetch all listings
  const { data: listingsData, isLoading, refetch: refetchListings } = useReadContracts({
    contracts: listingCalls,
  });

  const handleRefresh = () => {
    refetchNextId();
    refetchListings();
  };

  // Process data (Memoized)
  const allListings = useMemo(() => {
    if (!listingsData) return [];
    return listingsData
      .map((res: any, index: number) => {
        if (!res.result) return null;
        const data = res.result;
        return {
          id: BigInt(index),
          seller: data[1],
          buyer: data[2],
          price: data[3],
          deposit: data[4],
          pinHash: data[5],
          state: Number(data[6])
        };
      })
      .filter((l: any) => l && l.seller !== '0x0000000000000000000000000000000000000000');
  }, [listingsData]);

  const marketplaceItems = useMemo(() => 
    allListings.filter((l: any) => l.state === 0), 
  [allListings]);

  const myTrades = useMemo(() => 
    allListings.filter((l: any) =>
      (l.state === 1) && 
      (l.buyer?.toLowerCase() === address?.toLowerCase() || l.seller?.toLowerCase() === address?.toLowerCase())
    ),
  [allListings, address]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#090412]/80 backdrop-blur-md border-b border-purple-500/10 px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🤖</span>
              <span className="text-xl font-black tracking-tighter text-white">GARANTOR</span>
            </div>
            <span className="text-[9px] font-bold text-purple-500 tracking-[0.2em] -mt-1 ml-8 uppercase">MONAD ESCROW MARKET</span>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-2 bg-green-500/10 border border-green-500/20 px-3 py-1 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full pulse-green-dot" />
              <span className="text-[10px] font-black text-green-400 uppercase tracking-widest">Monad Testnet</span>
            </div>
            <button 
              onClick={handleRefresh}
              className="text-gray-400 hover:text-white transition-colors"
              title="Yenile"
            >
              <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
            </button>
            <ConnectButton />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 pt-28 pb-20">
        <div className="flex flex-col gap-12">
          
          {/* Hero Area (Hero Container) */}
          <div className="relative overflow-hidden bg-purple-900/10 border border-purple-500/20 rounded-[2.5rem] p-10 md:p-16 flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="flex-1 space-y-6 animate-in fade-in slide-in-from-left duration-1000">
              <div className="flex gap-3">
                <span className="bg-purple-600 text-[10px] font-black px-3 py-1 rounded-md tracking-widest uppercase">LIVE ON MONAD</span>
                <span className="bg-white/10 text-[10px] font-black px-3 py-1 rounded-md tracking-widest uppercase">ESCROW</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-black tracking-tight text-white leading-tight text-glow">
                İkinci El <br /> Güvenli Al&Sat
              </h1>
              <p className="text-gray-400 text-lg font-medium max-w-lg leading-relaxed">
                Satıcı kargoya verir, sen teslim alınca PIN gir — ödeme otomatik serbest kalır. 
                Güven yok, kontrat var.
              </p>
              
              <div className="flex flex-wrap gap-3 pt-2">
                <div className="flex items-center gap-2 border border-purple-500/30 px-4 py-2 rounded-full text-[11px] font-bold text-purple-300">
                  <Zap size={14} /> Anında İşlem
                </div>
                <div className="flex items-center gap-2 border border-purple-500/30 px-4 py-2 rounded-full text-[11px] font-bold text-purple-300">
                  <ShieldCheck size={14} /> %10 Depozito
                </div>
                <div className="flex items-center gap-2 border border-purple-500/30 px-4 py-2 rounded-full text-[11px] font-bold text-purple-300">
                  <Package size={14} /> PIN Teslimat
                </div>
              </div>

              <div className="pt-6">
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="bg-purple-600 hover:bg-purple-500 text-white px-8 py-4 rounded-xl font-black text-lg shadow-2xl shadow-purple-600/30 transition-all active:scale-95"
                >
                  İlan Oluştur
                </button>
              </div>
            </div>

            <div className="relative animate-float duration-1000">
              <div className="text-[120px] md:text-[180px] select-none">🤖</div>
              <div className="absolute -top-4 -right-10 bg-white text-black text-[10px] font-black px-4 py-2 rounded-2xl rounded-bl-none shadow-xl border-2 border-purple-500">
                Güven bende! 💜
              </div>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="flex gap-8 border-b border-white/5">
            <button
              onClick={() => setActiveTab('marketplace')}
              className={`pb-4 px-2 text-sm font-black transition-all relative ${
                activeTab === 'marketplace'
                  ? 'text-white border-b-2 border-purple-500'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              Marketplace
            </button>
            <button
              onClick={() => setActiveTab('my-trades')}
              className={`pb-4 px-2 text-sm font-black transition-all relative ${
                activeTab === 'my-trades'
                  ? 'text-white border-b-2 border-purple-500'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              Aktif İşlemlerim
            </button>
          </div>

          {/* Tab Content */}
          <div className="min-h-[400px]">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="animate-spin text-purple-500" size={48} />
                <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Ağdan Veriler Çekiliyor</p>
              </div>
            ) : activeTab === 'marketplace' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {marketplaceItems.length > 0 ? (
                  marketplaceItems.map((item: any, idx: number) => (
                    <ListingCard key={idx} listing={item} onRefresh={handleRefresh} />
                  ))
                ) : (
                  <div className="col-span-full py-20 text-center bg-white/[0.02] rounded-2xl border border-white/5">
                    <p className="text-gray-500 font-medium">Marketplace şu an boş.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {myTrades.length > 0 ? (
                  myTrades.map((item: any, idx: number) => (
                    <TradeCard key={idx} listing={item} onRefresh={handleRefresh} />
                  ))
                ) : (
                  <div className="col-span-full py-20 text-center bg-white/[0.02] rounded-2xl border border-white/5">
                    <p className="text-gray-500 font-medium">Henüz bir işleminiz yok.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-20 text-center">
        <p className="text-purple-500/40 text-xs font-bold uppercase tracking-[0.4em]">
          Built with 💜 on Monad — Hackathon 2025
        </p>
      </footer>

      <CreateListingModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onRefresh={handleRefresh} 
        nextId={totalListings}
      />
    </div>
  );
}
