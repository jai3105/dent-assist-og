
import React, { useState, useMemo } from 'react';
import { useCart } from '../../contexts/CartContext';
import type { Product, CartItem, Order, ProductComparison, CartAnalysis } from '../../types';
import { compareProducts, reviewCart } from '../../services/geminiService';
import { Spinner } from '../common/Spinner';
import { Search, X, ShoppingCart, Star, Plus, Minus, Trash2, History, Wand2, Lightbulb, Recycle, Sparkles, CheckSquare } from 'lucide-react';

const mockProducts: Product[] = [
    { id: 1, name: 'Composite Finishing Kit', description: 'A comprehensive kit for finishing and polishing composite restorations.', price: 150.00, image: 'https://picsum.photos/seed/p1/400/400', category: 'Instruments', brand: 'DentPro', rating: 4.5, stock: 50 },
    { id: 2, name: 'LED Curing Light', description: 'High-intensity LED curing light with multiple modes.', price: 450.00, image: 'https://picsum.photos/seed/p2/400/400', category: 'Equipment', brand: 'CureFast', rating: 4.8, stock: 20 },
    { id: 3, name: 'Dental Impression Material', description: 'VPS material for precise dental impressions.', price: 85.50, image: 'https://picsum.photos/seed/p3/400/400', category: 'Consumables', brand: 'Imprex', rating: 4.3, stock: 100 },
    { id: 4, name: 'Universal Composite Syringe (A2)', description: 'Nano-hybrid composite for anterior and posterior use.', price: 45.00, image: 'https://picsum.photos/seed/p4/400/400', category: 'Restoratives', brand: 'FillWell', rating: 4.7, stock: 200 },
    { id: 5, name: 'Dental Loupes 3.5x', description: 'High-quality TTL loupes for improved ergonomics and vision.', price: 1200.00, image: 'https://picsum.photos/seed/p5/400/400', category: 'Equipment', brand: 'VisionPlus', rating: 4.9, stock: 15 },
    { id: 6, name: 'Disposable Prophy Angles', description: 'Box of 144 soft-cup prophy angles.', price: 60.00, image: 'https://picsum.photos/seed/p6/400/400', category: 'Consumables', brand: 'CleanPro', rating: 4.2, stock: 300 },
    { id: 7, name: 'Root Canal Scaler Set', description: 'Set of 5 stainless steel endodontic scalers.', price: 220.00, image: 'https://picsum.photos/seed/p7/400/400', category: 'Instruments', brand: 'EndoKing', rating: 4.6, stock: 40 },
    { id: 8, name: 'Bulk-Fill Flowable Composite', description: 'Low-stress flowable composite for posterior restorations.', price: 95.00, image: 'https://picsum.photos/seed/p8/400/400', category: 'Restoratives', brand: 'FlowMax', rating: 4.4, stock: 80 },
];

const mockOrders: Order[] = [
    { id: 'ORD-001', date: '2024-07-15', items: [{...mockProducts[1], quantity: 1}], total: 450.00, status: 'Delivered' },
    { id: 'ORD-002', date: '2024-07-28', items: [{...mockProducts[3], quantity: 2}, {...mockProducts[5], quantity: 5}], total: 390.00, status: 'Shipped' },
    { id: 'ORD-003', date: '2024-08-01', items: [{...mockProducts[0], quantity: 1}], total: 150.00, status: 'Processing' },
];

const categories: Product['category'][] = ['Consumables', 'Equipment', 'Instruments', 'Restoratives'];

const ProductCard: React.FC<{ product: Product; isSelected: boolean; onSelect: (id: number) => void; }> = ({ product, isSelected, onSelect }) => {
    const { addToCart } = useCart();
    return (
        <div className={`bg-surface-dark rounded-lg shadow-md border border-border-dark overflow-hidden flex flex-col group transition-all duration-300 hover:shadow-lg ${isSelected ? 'border-brand-primary ring-2 ring-brand-primary' : 'hover:border-brand-primary'}`}>
            <div className="overflow-hidden relative">
                <img src={product.image} alt={product.name} className="w-full h-48 object-cover group-hover:scale-105 transition-transform" />
                <span className="absolute top-2 right-2 bg-brand-secondary/20 text-brand-secondary text-xs font-bold px-2 py-1 rounded-full">{product.brand}</span>
                 <input 
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onSelect(product.id)}
                    className="absolute top-2 left-2 h-5 w-5 rounded bg-black/50 border-slate-400 text-brand-primary focus:ring-brand-primary"
                    onClick={(e) => e.stopPropagation()}
                 />
            </div>
            <div className="p-4 flex flex-col flex-grow">
                <h3 className="text-lg font-bold text-text-primary-dark truncate flex-grow">{product.name}</h3>
                <div className="flex justify-between items-center mt-2">
                    <p className="text-xl font-extrabold text-brand-primary">₹{product.price.toFixed(2)}</p>
                    <div className="flex items-center gap-1 text-brand-secondary">
                        <Star size={16} fill="currentColor" />
                        <span className="font-bold text-sm">{product.rating.toFixed(1)}</span>
                    </div>
                </div>
                <button onClick={() => addToCart(product)} className="w-full mt-4 bg-brand-primary text-white font-semibold py-2 rounded-lg hover:bg-teal-500 transition-colors flex items-center justify-center gap-2">
                    <ShoppingCart size={18} /> Add to Cart
                </button>
            </div>
        </div>
    );
};

const CartAnalysisModal: React.FC<{ isOpen: boolean; onClose: () => void; cart: CartItem[] }> = ({ isOpen, onClose, cart }) => {
    const [result, setResult] = useState<CartAnalysis | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    React.useEffect(() => {
        if (isOpen && cart.length > 0) {
            const getAnalysis = async () => {
                setIsLoading(true);
                setResult(null);
                const res = await reviewCart(cart);
                setResult(res);
                setIsLoading(false);
            };
            getAnalysis();
        }
    }, [isOpen, cart]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-surface-dark rounded-xl shadow-2xl w-full max-w-2xl border border-border-dark flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b border-border-dark">
                    <h2 className="text-xl font-bold text-text-primary-dark flex items-center gap-3"><Wand2 className="text-brand-primary"/> AI Cart Analysis</h2>
                    <button onClick={onClose} className="text-text-secondary-dark hover:text-white"><X size={24} /></button>
                </div>
                <div className="p-6 overflow-y-auto flex-grow">
                    {isLoading && <div className="flex flex-col items-center justify-center p-12"><Spinner /><p className="mt-4 font-semibold text-text-secondary-dark">AI is reviewing your cart...</p></div>}
                    {result?.error && <p className="text-red-400">{result.error}</p>}
                    {result && !result.error && (
                        <div className="space-y-4">
                            <div className="bg-background-dark p-4 rounded-lg"><h4 className="font-bold text-lg text-brand-primary flex items-center gap-2 mb-2"><CheckSquare/> Summary</h4><p className="text-sm text-text-secondary-dark">{result.summary}</p></div>
                            {result.complementaryProducts.length > 0 && <div className="bg-background-dark p-4 rounded-lg"><h4 className="font-bold text-lg text-brand-primary flex items-center gap-2 mb-2"><Sparkles/> Complementary Products</h4><ul className="list-disc list-inside text-sm text-text-secondary-dark space-y-1">{result.complementaryProducts.map((p,i)=><li key={i}><strong>{p.name}:</strong> {p.reason}</li>)}</ul></div>}
                            {result.redundancies.length > 0 && <div className="bg-background-dark p-4 rounded-lg"><h4 className="font-bold text-lg text-brand-primary flex items-center gap-2 mb-2"><Recycle/> Potential Redundancies</h4><ul className="list-disc list-inside text-sm text-text-secondary-dark space-y-1">{result.redundancies.map((p,i)=><li key={i}><strong>{p.products.join(', ')}:</strong> {p.reason}</li>)}</ul></div>}
                            {result.costSavingAlternatives.length > 0 && <div className="bg-background-dark p-4 rounded-lg"><h4 className="font-bold text-lg text-brand-primary flex items-center gap-2 mb-2"><Lightbulb/> Cost-Saving Alternatives</h4><ul className="list-disc list-inside text-sm text-text-secondary-dark space-y-1">{result.costSavingAlternatives.map((p,i)=><li key={i}><strong>Instead of {p.original}, consider {p.alternative}:</strong> {p.reason}</li>)}</ul></div>}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const CartView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const { cart, removeFromCart, updateQuantity, clearCart } = useCart();
    const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
    const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);

    return (
        <div className="animate-fade-in">
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-text-primary-dark">Shopping Cart</h2>
                <button onClick={onBack} className="bg-border-dark px-4 py-2 rounded-lg text-text-primary-dark font-semibold hover:bg-slate-700">Back to Shop</button>
            </div>

            <div className="bg-surface-dark rounded-lg shadow-md border border-border-dark">
                 <div className="p-6 overflow-y-auto">
                    {cart.length === 0 ? (
                        <p className="text-center text-text-secondary-dark py-12">Your cart is empty.</p>
                    ) : (
                        <div className="space-y-4">
                            {cart.map(item => (
                                <div key={item.id} className="flex items-center gap-4 bg-background-dark p-3 rounded-lg">
                                    <img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded-md" />
                                    <div className="flex-grow">
                                        <p className="font-bold text-text-primary-dark">{item.name}</p>
                                        <p className="text-sm text-brand-primary font-semibold">₹{item.price.toFixed(2)}</p>
                                    </div>
                                    <div className="flex items-center gap-2 bg-border-dark p-1 rounded-md">
                                        <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-1 hover:bg-slate-600 rounded"><Minus size={16} /></button>
                                        <span className="w-8 text-center font-bold">{item.quantity}</span>
                                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-1 hover:bg-slate-600 rounded"><Plus size={16} /></button>
                                    </div>
                                    <p className="font-bold w-24 text-right">₹{(item.price * item.quantity).toFixed(2)}</p>
                                    <button onClick={() => removeFromCart(item.id)} className="text-red-500 hover:text-red-400 p-2"><Trash2 size={18} /></button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                {cart.length > 0 && (
                    <div className="p-6 border-t border-border-dark space-y-4">
                        <button onClick={() => setIsAnalysisOpen(true)} className="w-full bg-brand-secondary/20 border border-brand-secondary/50 text-brand-secondary font-bold py-2.5 rounded-lg hover:bg-brand-secondary/30 flex items-center justify-center gap-2">
                           <Wand2 /> AI Cart Review
                        </button>
                        <div className="flex justify-between text-lg">
                            <span className="text-text-secondary-dark">Subtotal</span>
                            <span className="font-bold text-text-primary-dark">₹{subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                             <button onClick={clearCart} className="text-sm text-red-500 hover:underline">Clear Cart</button>
                             <button className="w-full max-w-xs bg-brand-primary text-white font-bold py-3 rounded-lg hover:bg-teal-500 transition-colors text-lg">Checkout</button>
                        </div>
                    </div>
                )}
            </div>
            <CartAnalysisModal isOpen={isAnalysisOpen} onClose={() => setIsAnalysisOpen(false)} cart={cart} />
        </div>
    );
};

const CompareModal: React.FC<{ isOpen: boolean; onClose: () => void; products: Product[] }> = ({ isOpen, onClose, products }) => {
    const [result, setResult] = useState<ProductComparison | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    React.useEffect(() => {
        if (isOpen && products.length > 1) {
            const getComparison = async () => {
                setIsLoading(true);
                setResult(null);
                const res = await compareProducts(products);
                setResult(res);
                setIsLoading(false);
            };
            getComparison();
        }
    }, [isOpen, products]);

    if (!isOpen) return null;

    return (
         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-surface-dark rounded-xl shadow-2xl w-full max-w-4xl border border-border-dark flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b border-border-dark">
                    <h2 className="text-2xl font-bold text-text-primary-dark flex items-center gap-3"><Wand2/> AI Product Comparison</h2>
                    <button onClick={onClose} className="text-text-secondary-dark hover:text-white"><X size={24} /></button>
                </div>
                <div className="p-6 overflow-y-auto flex-grow">
                    {isLoading && <div className="flex flex-col items-center justify-center p-12"><Spinner /><p className="mt-4 font-semibold text-text-secondary-dark">AI is comparing products...</p></div>}
                    {result?.error && <p className="text-red-400">{result.error}</p>}
                    {result && !result.error && (
                        <div className="space-y-6">
                            <div className={`grid grid-cols-1 md:grid-cols-${result.comparison.length} gap-6`}>
                                {result.comparison.map((comp, i) => (
                                    <div key={i} className="bg-background-dark p-4 rounded-lg border border-border-dark">
                                        <h3 className="font-bold text-lg text-brand-primary">{comp.productName}</h3>
                                        <p className="text-sm text-text-secondary-dark mt-2">{comp.summary}</p>
                                        <h4 className="font-semibold text-green-400 mt-4">Pros</h4>
                                        <ul className="list-disc list-inside text-sm text-text-secondary-dark space-y-1">{comp.pros.map((p, j) => <li key={j}>{p}</li>)}</ul>
                                        <h4 className="font-semibold text-red-400 mt-4">Cons</h4>
                                        <ul className="list-disc list-inside text-sm text-text-secondary-dark space-y-1">{comp.cons.map((c, j) => <li key={j}>{c}</li>)}</ul>
                                    </div>
                                ))}
                            </div>
                            <div className="bg-background-dark p-4 rounded-lg border border-border-dark">
                                <h3 className="font-bold text-lg text-brand-secondary">Recommendation</h3>
                                <p className="text-sm text-text-secondary-dark mt-2">{result.recommendation}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const OrderHistoryView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const statusColors: Record<Order['status'], string> = {
    Processing: 'bg-blue-500/20 text-blue-300',
    Shipped: 'bg-purple-500/20 text-purple-300',
    Delivered: 'bg-green-500/20 text-green-300',
    Cancelled: 'bg-red-500/20 text-red-300',
  };

  return (
    <div className="animate-fade-in">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-text-primary-dark">Order History</h2>
            <button onClick={onBack} className="bg-border-dark px-4 py-2 rounded-lg text-text-primary-dark font-semibold hover:bg-slate-700">Back to Shop</button>
        </div>
        <div className="space-y-6">
          {mockOrders.map(order => (
            <div key={order.id} className="bg-surface-dark rounded-lg shadow-md border border-border-dark p-4">
              <div className="flex justify-between items-center border-b border-border-dark pb-3 mb-3">
                <div>
                  <p className="font-bold text-text-primary-dark">Order {order.id}</p>
                  <p className="text-sm text-text-secondary-dark">Date: {order.date}</p>
                </div>
                <div className="text-right">
                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${statusColors[order.status]}`}>{order.status}</span>
                    <p className="font-bold text-text-primary-dark mt-1">Total: ₹{order.total.toFixed(2)}</p>
                </div>
              </div>
              <div className="space-y-2">
                {order.items.map(item => (
                    <div key={item.id} className="flex items-center gap-3 text-sm">
                        <img src={item.image} alt={item.name} className="w-10 h-10 rounded-md object-cover"/>
                        <p className="flex-grow text-text-secondary-dark">{item.name} <span className="text-xs">(Qty: {item.quantity})</span></p>
                        <p className="font-semibold text-text-primary-dark">₹{(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                ))}
              </div>
            </div>
          ))}
        </div>
    </div>
  );
};


export const DentaMart: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState<string>('All');
    const [sortOrder, setSortOrder] = useState('rating-desc');
    const [isCompareOpen, setIsCompareOpen] = useState(false);
    const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
    const [view, setView] = useState<'shop' | 'cart' | 'history'>('shop');
    
    const { itemCount } = useCart();

    const handleSelectProduct = (id: number) => {
        setSelectedProducts(prev => 
            prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
        );
    };

    const filteredAndSortedProducts = useMemo(() => {
        return mockProducts
            .filter(p => activeCategory === 'All' || p.category === activeCategory)
            .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
            .sort((a, b) => {
                switch (sortOrder) {
                    case 'price-asc': return a.price - b.price;
                    case 'price-desc': return b.price - a.price;
                    case 'rating-desc': return b.rating - a.rating;
                    default: return b.rating - a.rating;
                }
            });
    }, [searchQuery, activeCategory, sortOrder]);

    const renderShopView = () => (
      <>
        <div className="bg-surface-dark p-4 rounded-lg mb-6 border border-border-dark shadow-sm">
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary-dark" />
                    <input type="text" placeholder="Search products..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-background-dark border border-border-dark rounded-lg p-2 pl-10 text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-brand-primary" />
                </div>
                <select value={sortOrder} onChange={e => setSortOrder(e.target.value)} className="w-full md:w-auto bg-background-dark border border-border-dark rounded-lg p-2 text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-brand-primary">
                    <option value="rating-desc">Sort by Rating</option>
                    <option value="price-asc">Sort by Price: Low to High</option>
                    <option value="price-desc">Sort by Price: High to Low</option>
                </select>
            </div>
            <div className="mt-4 pt-4 border-t border-border-dark flex flex-wrap gap-2 items-center">
                <button onClick={() => setActiveCategory('All')} className={`px-3 py-1 text-sm font-semibold rounded-full transition-colors ${activeCategory === 'All' ? 'bg-brand-primary text-white' : 'bg-background-dark text-text-secondary-dark hover:bg-border-dark'}`}>All</button>
                {categories.map(cat => (
                    <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-3 py-1 text-sm font-semibold rounded-full transition-colors ${activeCategory === cat ? 'bg-brand-primary text-white' : 'bg-background-dark text-text-secondary-dark hover:bg-border-dark'}`}>{cat}</button>
                ))}
            </div>
        </div>

        {selectedProducts.length > 1 && (
            <div className="sticky top-20 z-10 my-4 flex justify-center">
                <button 
                    onClick={() => setIsCompareOpen(true)}
                    className="bg-brand-secondary text-background-dark font-bold py-3 px-6 rounded-lg shadow-lg hover:brightness-110 transition-all flex items-center gap-2"
                >
                    <Wand2 /> Compare {selectedProducts.length} Items
                </button>
            </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAndSortedProducts.map(product => <ProductCard key={product.id} product={product} isSelected={selectedProducts.includes(product.id)} onSelect={handleSelectProduct} />)}
        </div>

         {filteredAndSortedProducts.length === 0 && (
            <div className="text-center py-20 px-6 bg-surface-dark rounded-lg">
                <h3 className="text-xl font-semibold text-text-primary-dark">No Products Found</h3>
                <p className="mt-1 text-text-secondary-dark">Try adjusting your search or filter criteria.</p>
            </div>
        )}
      </>
    );
    
    const renderContent = () => {
        switch(view) {
            case 'shop': return renderShopView();
            case 'cart': return <CartView onBack={() => setView('shop')} />;
            case 'history': return <OrderHistoryView onBack={() => setView('shop')} />;
            default: return null;
        }
    }

    return (
        <div className="max-w-7xl mx-auto">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-text-primary-dark">DentaMart</h2>
                <p className="text-text-secondary-dark mt-2">Your one-stop shop for professional dental supplies.</p>
                 <div className="mt-4 flex justify-center items-center gap-4">
                    <button onClick={() => setView('shop')} className={`px-5 py-2 rounded-lg font-semibold transition-colors ${view === 'shop' ? 'bg-brand-primary text-white' : 'bg-surface-dark text-text-primary-dark border border-border-dark hover:bg-border-dark'}`}>Shop</button>
                    <button onClick={() => setView('cart')} className="bg-surface-dark px-5 py-2 rounded-lg text-text-primary-dark font-semibold border border-border-dark hover:bg-border-dark inline-flex items-center gap-2">
                        <ShoppingCart size={20}/> View Cart ({itemCount})
                    </button>
                    <button onClick={() => setView('history')} className={`px-5 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 ${view === 'history' ? 'bg-brand-primary text-white' : 'bg-surface-dark text-text-primary-dark border border-border-dark hover:bg-border-dark'}`}><History size={20}/> Order History</button>
                 </div>
            </div>
            
            {renderContent()}
            
            <CompareModal 
                isOpen={isCompareOpen} 
                onClose={() => setIsCompareOpen(false)} 
                products={mockProducts.filter(p => selectedProducts.includes(p.id))}
            />
        </div>
    );
};
