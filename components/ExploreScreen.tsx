
import React, { useState, useEffect } from 'react';
import { getStores, getCategories } from '../constants';
import { Search, MapPin, Star, Store as StoreIconLucide, Loader2 } from 'lucide-react';
import { Store, Category } from '../types';

interface ExploreScreenProps {
  onStoreClick?: (storeId: string) => void;
}

const ExploreScreen: React.FC<ExploreScreenProps> = ({ onStoreClick }) => {
  const [stores, setStores] = useState<Store[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredStores, setFilteredStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [storesData, categoriesData] = await Promise.all([
          getStores(),
          getCategories()
        ]);
        
        setStores(storesData);
        setFilteredStores(storesData);
        
        if (categoriesData.length === 0) {
          // Fallback: extract unique categories from stores if the categories collection is empty
          const allCategories = storesData.flatMap(s => s.categories && s.categories.length > 0 ? s.categories : [s.category]).filter(Boolean);
          const uniqueCategories = Array.from(new Set(allCategories));
          setCategories(uniqueCategories.map(name => ({ id: name, name })));
        } else {
          setCategories(categoriesData);
        }
      } catch (err) {
        console.error("Erro ao explorar lojas:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    let result = stores;

    if (selectedCategory !== 'Todas') {
      const targetCategory = selectedCategory.trim().toLowerCase();
      result = result.filter(store => {
        const storeCategories = store.categories && store.categories.length > 0 
          ? store.categories 
          : [store.category || ''];
        
        return storeCategories.some(cat => cat.trim().toLowerCase() === targetCategory);
      });
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(store => {
        const nameMatch = (store.name || '').toLowerCase().includes(query);
        
        const storeCategories = store.categories && store.categories.length > 0 
          ? store.categories 
          : [store.category || ''];
        const categoryMatch = storeCategories.some(cat => cat.toLowerCase().includes(query));
        
        const descMatch = (store.description || '').toLowerCase().includes(query);
        return nameMatch || categoryMatch || descMatch;
      });
    }

    setFilteredStores(result);
  }, [searchQuery, selectedCategory, stores]);

  return (
    <div className="p-4 h-full flex flex-col gap-6 overflow-y-auto bg-gray-50 pb-20">
      <h1 className="text-2xl font-bold text-gray-800">Explorar Parceiros</h1>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input 
          type="text" 
          placeholder="O que você está procurando hoje?"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-sm"
        />
      </div>

      <div>
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3">Categorias</h2>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          <button 
            onClick={() => setSelectedCategory('Todas')}
            className={`px-4 py-2 border rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
              selectedCategory === 'Todas' 
                ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100' 
                : 'bg-white border-gray-200 text-gray-700 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600'
            }`}
          >
            Todas
          </button>
          {categories.map(cat => (
            <button 
              key={cat.id}
              onClick={() => setSelectedCategory(cat.name)}
              className={`px-4 py-2 border rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat.name 
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100' 
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest">
            {selectedCategory === 'Todas' ? 'Lojas Parceiras' : `Parceiros em ${selectedCategory}`}
          </h2>
          <span className="text-xs font-bold text-gray-400">{filteredStores.length} resultados</span>
        </div>
        <div className="grid grid-cols-1 gap-4">
          {filteredStores.map(store => (
            <div 
              key={store.id} 
              onClick={() => onStoreClick?.(store.id)}
              className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:border-indigo-100 transition-colors cursor-pointer active:scale-[0.98]"
            >
              <img src={store.logo} alt={store.name} className="w-16 h-16 rounded-xl object-cover" />
              <div className="flex-1">
                <h3 className="font-bold text-gray-900">{store.name}</h3>
                <p className="text-xs text-gray-500 mb-2 truncate">
                  {(store.categories && store.categories.length > 0 ? store.categories : [store.category]).join(', ')}
                </p>
                <div className="flex items-center gap-3">
                   <div className="flex items-center gap-1 text-amber-500">
                    <Star size={12} fill="currentColor" />
                    <span className="text-xs font-bold">{store.rating || '5.0'}</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-400">
                    <MapPin size={12} />
                    <span className="text-[10px] font-medium">Perto de você</span>
                  </div>
                </div>
              </div>
              <button className="bg-indigo-600 text-white p-2.5 rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100">
                <StoreIconLucide size={20} />
              </button>
            </div>
          ))}
          
          {!loading && filteredStores.length === 0 && (
            <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-gray-200">
              <div className="bg-gray-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <Search size={20} className="text-gray-300" />
              </div>
              <p className="text-gray-500 font-bold">Nenhum parceiro encontrado</p>
              <p className="text-xs text-gray-400 mt-1">Tente mudar sua busca ou categoria</p>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="animate-spin text-indigo-500 mb-2" size={32} />
              <p className="text-center text-gray-400 text-xs italic">Buscando parceiros...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExploreScreen;
