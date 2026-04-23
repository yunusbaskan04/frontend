'use client';

import { useState, useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useReadContract, useReadContracts, useAccount } from 'wagmi';
import { escrowABI } from '../constants/abi';
import { CreateListingModal } from '../components/CreateListingModal';
import { ListingCard } from '../components/ListingCard';
import { TradeCard } from '../components/TradeCard';
import { LayoutGrid, ClipboardList, RefreshCw, Loader2 } from 'lucide-react';

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

  // 2. Prepare calls for all listings
  const listingCalls = Array.from({ length: totalListings }, (_, i) => ({
    address: CONTRACT_ADDRESS,
    abi: escrowABI,
    functionName: 'listings',
    args: [BigInt(i)],
  }));

  // 3. Fetch all listings
  const { data: listingsData, isLoading, refetch: refetchListings } = useReadContracts({
    contracts: listingCalls,
  });

  const handleRefresh = () => {
    refetchNextId();
    refetchListings();
  };

  // Debugging logs
  useEffect(() => {
    console.log("Listing Count (nextListingId):", totalListings);
    console.log("Raw Listings Data:", listingsData);
  }, [totalListings, listingsData]);

  const allListings = listingsData
    ? listingsData
        .map((res: any, index: number) => {
          if (!res.result) return null;
          const data = res.result;
          return {
            id: BigInt(index), // Use index as ID if id is index-based
            seller: data[1],
            buyer: data[2],
            price: data[3],
            deposit: data[4],
            pinHash: data[5],
            state: Number(data[6])
          };
        })
        .filter((l: any) => l && l.seller !== '0x0000000000000000000000000000000000000000')
    : [];

  const marketplaceItems = allListings.filter((l: any) => l.state === 0); // AVAILABLE
  const myTrades = allListings.filter(
    (l: any) =>
      (l.state === 1) && // LOCKED
      (l.buyer?.toLowerCase() === address?.toLowerCase() || l.seller?.toLowerCase() === address?.toLowerCase())
  );

  return (
    <div className="flex flex-col min-h-screen">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/40 backdrop-blur-md border-b border-white/10 px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="text-2xl font-black tracking-tighter text-purple-500 neon-purple drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]">
            GARANTÖR
          </div>
          <div className="flex items-center gap-6">
            <button 
              onClick={handleRefresh}
              className="text-gray-400 hover:text-white transition-colors"
              title="Yenile"
            >
              <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
            </button>
            <ConnectButton />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 pt-32 pb-20">
        <div className="flex flex-col gap-16">
          
          {/* Hero Section */}
          <div className="text-center space-y-6 max-w-4xl mx-auto animate-in fade-in slide-in-from-top-10 duration-1000">
            <h1 className="text-5xl md:text-7xl font-black tracking-tight text-white leading-tight">
              Güvene Dayalı Değil, <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-500">
                Koda Dayalı Ticaret
              </span>
            </h1>
            <p className="text-gray-400 text-xl font-medium">
              Monad ağında anında ve güvenli alışveriş. 
              Garantör ile paranız kontrat güvencesinde.
            </p>
            <div className="pt-4">
              <button 
                onClick={() => setIsModalOpen(true)}
                className="btn-gradient text-white px-10 py-4 rounded-lg font-bold text-lg active:scale-95 shadow-xl"
              >
                İlan Oluştur
              </button>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="flex justify-center gap-4">
            <div className="bg-white/5 p-1 rounded-xl border border-white/10 backdrop-blur-sm">
              <button
                onClick={() => setActiveTab('marketplace')}
                className={`px-8 py-3 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'marketplace'
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <LayoutGrid size={18} />
                Marketplace
              </button>
              <button
                onClick={() => setActiveTab('my-trades')}
                className={`px-8 py-3 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'my-trades'
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <ClipboardList size={18} />
                Aktif İşlemlerim
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="min-h-[400px]">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="animate-spin text-purple-500" size={48} />
                <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Veriler Yükleniyor</p>
              </div>
            ) : activeTab === 'marketplace' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {marketplaceItems.length > 0 ? (
                  marketplaceItems.map((item: any, idx: number) => (
                    <ListingCard key={idx} listing={item} onRefresh={handleRefresh} />
                  ))
                ) : (
                  <div className="col-span-full py-20 text-center bg-white/5 rounded-2xl border border-white/10">
                    <h3 className="text-white font-bold text-xl mb-2">Henüz ilan bulunmuyor.</h3>
                    {allListings.length > 0 && (
                      <p className="text-gray-500 font-medium">
                        Kontratta {allListings.length} ilan var ama Marketplace kriterleriyle (AVAILABLE) eşleşmiyor.
                      </p>
                    )}
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
                  <div className="col-span-full py-20 text-center bg-white/5 rounded-2xl border border-white/10">
                    <h3 className="text-white font-bold text-xl mb-2">Aktif işleminiz bulunmamaktadır.</h3>
                    {allListings.length > 0 && (
                      <p className="text-gray-500 font-medium">
                        Kontratta ilanlar var ama senin adresinle ilgili veya LOCKED durumunda değil.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5 text-center">
        <p className="text-gray-500 text-sm font-bold uppercase tracking-widest">
          © 2024 GARANTÖR • Monad Testnet
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
