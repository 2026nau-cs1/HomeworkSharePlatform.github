import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/lib/api';
import { toast } from 'sonner';
import type { Material, User } from '@/types';
import { DEPARTMENTS, MATERIAL_TYPE_LABELS, DEPARTMENT_COUNTS } from '@/types';
import OmniflowBadge from '@/components/custom/OmniflowBadge';
import {
  BookOpen, Search, Upload, Bookmark, TrendingUp, User as UserIcon,
  Menu, X, Download, Star, Eye, Flag, ChevronLeft, ChevronRight,
  LogOut, Settings, Shield, FileText, BookMarked, Clock, Plus,
  Trash2, CheckCircle, XCircle, AlertTriangle, Filter
} from 'lucide-react';

type View = 'home' | 'upload' | 'bookmarks' | 'profile' | 'admin' | 'detail';

const StarRating = ({ rating, max = 5, size = 'sm' }: { rating: number; max?: number; size?: 'sm' | 'md' }) => {
  const stars = [];
  for (let i = 1; i <= max; i++) {
    stars.push(
      <span key={i} className={`${size === 'sm' ? 'text-xs' : 'text-sm'} ${i <= Math.round(rating) ? 'text-[#F59E0B]' : 'text-gray-300'}`}>
        ★
      </span>
    );
  }
  return <span className="inline-flex">{stars}</span>;
};

const TypeBadge = ({ type }: { type: string }) => {
  const colors: Record<string, string> = {
    notes: 'bg-[#F59E0B] text-[#1E3A5F]',
    exam: 'bg-[#2D6A9F] text-white',
    guide: 'bg-[#16A34A] text-white',
    slides: 'bg-purple-500 text-white',
  };
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${colors[type] || 'bg-gray-200 text-gray-700'}`}>
      {MATERIAL_TYPE_LABELS[type] || type}
    </span>
  );
};

const FormatBadge = ({ format }: { format: string }) => (
  <span className="bg-black/40 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded-full">{format}</span>
);

const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (h < 1) return '刚刚';
  if (h < 24) return `${h}小时前`;
  if (d < 7) return `${d}天前`;
  return new Date(dateStr).toLocaleDateString('zh-CN');
};

const TRENDING_IMAGES = [
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&q=80',
  'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&q=80',
  'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&q=80',
];

export default function Index() {
  const { logout } = useAuth();
  const [view, setView] = useState<View>('home');
  const [selectedMaterialId, setSelectedMaterialId] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Home state
  const [materials, setMaterials] = useState<Material[]>([]);
  const [trending, setTrending] = useState<Material[]>([]);
  const [totalMaterials, setTotalMaterials] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterRating, setFilterRating] = useState(0);
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<number>>(new Set());

  const LIMIT = 8;
  const totalPages = Math.ceil(totalMaterials / LIMIT);

  const fetchUser = useCallback(async () => {
    const res = await apiService.getMe();
    if (res.success) setCurrentUser(res.data);
  }, []);

  const fetchMaterials = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiService.getMaterials({
        search, type: filterType, department: filterDept,
        minRating: filterRating || undefined, sort, page, limit: LIMIT,
      });
      if (res.success) {
        setMaterials(res.data.items);
        setTotalMaterials(res.data.total);
      }
    } finally {
      setLoading(false);
    }
  }, [search, filterType, filterDept, filterRating, sort, page]);

  const fetchTrending = useCallback(async () => {
    const res = await apiService.getTrending();
    if (res.success) setTrending(res.data);
  }, []);

  const fetchBookmarkedIds = useCallback(async () => {
    const res = await apiService.getBookmarks();
    if (res.success) {
      setBookmarkedIds(new Set(res.data.map((b) => b.materialId)));
    }
  }, []);

  useEffect(() => {
    fetchUser();
    fetchTrending();
    fetchBookmarkedIds();
  }, [fetchUser, fetchTrending, fetchBookmarkedIds]);

  useEffect(() => {
    if (view === 'home') fetchMaterials();
  }, [view, fetchMaterials]);

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  const handleToggleBookmark = async (materialId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const res = await apiService.toggleBookmark(materialId);
    if (res.success) {
      setBookmarkedIds((prev) => {
        const next = new Set(prev);
        if (res.data.bookmarked) next.add(materialId);
        else next.delete(materialId);
        return next;
      });
      toast.success(res.data.bookmarked ? '已添加收藏' : '已取消收藏');
    }
  };

  const handleDownload = async (material: Material, e: React.MouseEvent) => {
    e.stopPropagation();
    const res = await apiService.downloadMaterial(material.id);
    if (res.success) {
      toast.success('下载成功', { description: material.title });
      fetchUser();
      fetchMaterials();
    } else {
      toast.error(res.message || '下载失败');
    }
  };

  const openDetail = (id: number) => {
    setSelectedMaterialId(id);
    setView('detail');
  };

  const downloadQuota = () => {
    if (!currentUser) return { used: 0, total: 10 };
    if (currentUser.membershipType === 'premium') return { used: 0, total: Infinity };
    const today = new Date().toISOString().split('T')[0];
    const used = currentUser.downloadResetDate === today ? (currentUser.downloadCountToday || 0) : 0;
    return { used, total: 10 };
  };

  const quota = downloadQuota();

  const navItems: { id: View; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: '浏览资料', icon: <Search className="w-4 h-4" /> },
    { id: 'upload', label: '上传资料', icon: <Upload className="w-4 h-4" /> },
    { id: 'bookmarks', label: '我的收藏', icon: <Bookmark className="w-4 h-4" /> },
    { id: 'profile', label: '个人中心', icon: <UserIcon className="w-4 h-4" /> },
    ...(currentUser?.role === 'admin' ? [{ id: 'admin' as View, label: '管理员', icon: <Shield className="w-4 h-4" /> }] : []),
  ];

  return (
    <div className="min-h-screen bg-[#F0F4F8]">
      {/* NAVBAR */}
      <nav className="bg-[#1E3A5F] shadow-lg sticky top-0 z-50">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => { setView('home'); setMobileMenuOpen(false); }}
              className="flex items-center gap-3"
            >
              <div className="w-8 h-8 bg-[#F59E0B] rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-[#1E3A5F]" />
              </div>
              <span className="text-white font-serif text-xl font-bold tracking-tight">StudyShare</span>
              <span className="hidden sm:inline text-white/40 text-sm">|</span>
              <span className="hidden sm:inline text-white/60 text-xs uppercase tracking-widest">大学生资料共享平台</span>
            </button>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setView(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    view === item.id
                      ? 'bg-white/20 text-white'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              {currentUser && (
                <div className="hidden sm:flex items-center gap-2">
                  <span className="text-white/70 text-xs">{currentUser.name}</span>
                  {currentUser.membershipType === 'premium' && (
                    <span className="bg-[#F59E0B] text-[#1E3A5F] text-xs font-bold px-2 py-0.5 rounded-full">会员</span>
                  )}
                </div>
              )}
              <button
                onClick={() => { logout(); }}
                className="hidden sm:flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-sm px-3 py-2 rounded-lg transition-all border border-white/20"
              >
                <LogOut className="w-4 h-4" />
                退出
              </button>
              <button
                className="md:hidden text-white p-2"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#1E3A5F] border-t border-white/10 px-4 py-3 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => { setView(item.id); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  view === item.id ? 'bg-white/20 text-white' : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
            <button
              onClick={() => { logout(); setMobileMenuOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/10 transition-all"
            >
              <LogOut className="w-4 h-4" />
              退出
            </button>
          </div>
        )}
      </nav>

      {/* VIEWS */}
      {view === 'home' && (
        <HomeView
          materials={materials}
          trending={trending}
          totalMaterials={totalMaterials}
          loading={loading}
          searchInput={searchInput}
          setSearchInput={setSearchInput}
          handleSearch={handleSearch}
          filterType={filterType}
          setFilterType={(v) => { setFilterType(v); setPage(1); }}
          filterDept={filterDept}
          setFilterDept={(v) => { setFilterDept(v); setPage(1); }}
          filterRating={filterRating}
          setFilterRating={(v) => { setFilterRating(v); setPage(1); }}
          sort={sort}
          setSort={(v) => { setSort(v); setPage(1); }}
          page={page}
          setPage={setPage}
          totalPages={totalPages}
          bookmarkedIds={bookmarkedIds}
          onToggleBookmark={handleToggleBookmark}
          onDownload={handleDownload}
          onOpenDetail={openDetail}
          quota={quota}
          currentUser={currentUser}
          onUpgrade={() => setView('profile')}
        />
      )}

      {view === 'detail' && selectedMaterialId && (
        <DetailView
          materialId={selectedMaterialId}
          onBack={() => setView('home')}
          bookmarkedIds={bookmarkedIds}
          onToggleBookmark={handleToggleBookmark}
          onDownload={handleDownload}
          currentUser={currentUser}
        />
      )}

      {view === 'upload' && (
        <UploadView
          onSuccess={() => { setView('home'); fetchMaterials(); fetchTrending(); }}
          currentUser={currentUser}
        />
      )}

      {view === 'bookmarks' && (
        <BookmarksView
          onOpenDetail={openDetail}
          onToggleBookmark={handleToggleBookmark}
          bookmarkedIds={bookmarkedIds}
        />
      )}

      {view === 'profile' && (
        <ProfileView
          currentUser={currentUser}
          onRefreshUser={fetchUser}
          onOpenDetail={openDetail}
        />
      )}

      {view === 'admin' && currentUser?.role === 'admin' && (
        <AdminView />
      )}

      <OmniflowBadge />
    </div>
  );
}

// ============================================================
// HOME VIEW
// ============================================================
function HomeView({
  materials, trending, totalMaterials, loading,
  searchInput, setSearchInput, handleSearch,
  filterType, setFilterType, filterDept, setFilterDept,
  filterRating, setFilterRating, sort, setSort,
  page, setPage, totalPages,
  bookmarkedIds, onToggleBookmark, onDownload, onOpenDetail,
  quota, currentUser, onUpgrade,
}: {
  materials: Material[];
  trending: Material[];
  totalMaterials: number;
  loading: boolean;
  searchInput: string;
  setSearchInput: (v: string) => void;
  handleSearch: () => void;
  filterType: string;
  setFilterType: (v: string) => void;
  filterDept: string;
  setFilterDept: (v: string) => void;
  filterRating: number;
  setFilterRating: (v: number) => void;
  sort: string;
  setSort: (v: string) => void;
  page: number;
  setPage: (v: number) => void;
  totalPages: number;
  bookmarkedIds: Set<number>;
  onToggleBookmark: (id: number, e: React.MouseEvent) => void;
  onDownload: (m: Material, e: React.MouseEvent) => void;
  onOpenDetail: (id: number) => void;
  quota: { used: number; total: number };
  currentUser: User | null;
  onUpgrade: () => void;
}) {
  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-[#1E3A5F] pb-20 pt-14">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#2D6A9F] rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-[#F59E0B] rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-6">
              <span className="w-2 h-2 bg-[#F59E0B] rounded-full animate-pulse" />
              <span className="text-white/80 text-xs uppercase tracking-widest font-medium">已收录 20,000+ 份学习资料</span>
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl font-bold text-white leading-tight mb-6">
              找到你需要的<br />
              <span className="text-[#F59E0B]">每一份课程资料</span>
            </h1>
            <p className="text-white/70 text-lg leading-relaxed mb-10 max-w-2xl mx-auto">
              由同学共建的学习资料平台。上传笔记、历年真题、学习指南，帮助彼此更高效地备考与学习。
            </p>
            {/* Search Bar */}
            <div className="bg-white rounded-2xl p-2 shadow-2xl flex flex-col sm:flex-row gap-2 max-w-2xl mx-auto">
              <div className="flex-1 flex items-center gap-3 px-4">
                <Search className="w-5 h-5 text-[#5A7A99] flex-shrink-0" />
                <input
                  type="search"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="搜索课程代码、资料名称或院系…"
                  className="flex-1 py-3 text-[#0F1F33] placeholder-[#5A7A99] text-sm outline-none bg-transparent"
                />
              </div>
              <div className="flex items-center gap-2 px-2">
                <select
                  value={filterType}
                  onChange={(e) => { setFilterType(e.target.value); }}
                  className="text-sm text-[#5A7A99] bg-[#F0F4F8] border border-[#CBD8E8] rounded-lg px-3 py-2.5 outline-none cursor-pointer"
                >
                  <option value="">全部类型</option>
                  <option value="notes">课堂笔记</option>
                  <option value="exam">历年真题</option>
                  <option value="guide">学习指南</option>
                  <option value="slides">PPT 课件</option>
                </select>
                <button
                  onClick={handleSearch}
                  className="bg-[#1E3A5F] hover:bg-[#2D6A9F] text-white font-semibold px-6 py-2.5 rounded-xl transition-all text-sm whitespace-nowrap"
                >
                  搜索
                </button>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              <span className="text-white/50 text-xs">热门搜索：</span>
              {['CS101 数据结构', '高等数学期末真题', '线性代数笔记', '英语四六级'].map((kw) => (
                <button
                  key={kw}
                  onClick={() => { setSearchInput(kw); handleSearch(); }}
                  className="text-white/70 hover:text-[#F59E0B] text-xs transition-colors"
                >
                  {kw}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="bg-white border-b border-[#CBD8E8] shadow-sm">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[['20,000+', '学习资料'], ['5,000+', '活跃学生'], ['10+', '覆盖院系'], ['+40', '用户净推荐值']].map(([val, label], i) => (
              <div key={label} className="text-center">
                <div className={`font-serif text-3xl font-bold ${i === 3 ? 'text-[#F59E0B]' : 'text-[#1E3A5F]'}`}>{val}</div>
                <div className="text-[#5A7A99] text-sm mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MAIN */}
      <main className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-2 mb-8">
          <Filter className="w-4 h-4 text-[#5A7A99]" />
          <span className="text-[#5A7A99] text-sm font-medium">筛选：</span>
          {[{ val: '', label: '全部' }, { val: 'notes', label: '课堂笔记' }, { val: 'exam', label: '历年真题' }, { val: 'guide', label: '学习指南' }, { val: 'slides', label: 'PPT 课件' }].map((f) => (
            <button
              key={f.val}
              onClick={() => setFilterType(f.val)}
              className={`text-sm px-4 py-1.5 rounded-full transition-all duration-200 ${
                filterType === f.val
                  ? 'bg-[#1E3A5F] text-white'
                  : 'bg-white border border-[#CBD8E8] text-[#5A7A99] hover:border-[#2D6A9F] hover:text-[#2D6A9F]'
              }`}
            >
              {f.label}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-[#5A7A99] text-sm">排序：</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="text-sm border border-[#CBD8E8] rounded-lg px-3 py-1.5 text-[#0F1F33] bg-white outline-none"
            >
              <option value="newest">最新上传</option>
              <option value="rating">评分最高</option>
              <option value="downloads">下载最多</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* SIDEBAR */}
          <aside className="lg:col-span-1 space-y-5">
            {/* Department Filter */}
            <div className="bg-white rounded-2xl border border-[#CBD8E8] p-5 shadow-sm">
              <h3 className="font-serif font-semibold text-[#0F1F33] mb-4 text-sm uppercase tracking-wide">按院系浏览</h3>
              <ul className="space-y-1">
                <li>
                  <button
                    onClick={() => setFilterDept('')}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                      filterDept === '' ? 'bg-[#1E3A5F]/10 text-[#1E3A5F] font-medium' : 'text-[#5A7A99] hover:bg-[#F0F4F8] hover:text-[#0F1F33]'
                    }`}
                  >
                    <span>全部院系</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      filterDept === '' ? 'bg-[#1E3A5F] text-white' : 'text-[#5A7A99]'
                    }`}>{totalMaterials}</span>
                  </button>
                </li>
                {DEPARTMENTS.map((dept) => (
                  <li key={dept}>
                    <button
                      onClick={() => setFilterDept(dept)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                        filterDept === dept ? 'bg-[#1E3A5F]/10 text-[#1E3A5F] font-medium' : 'text-[#5A7A99] hover:bg-[#F0F4F8] hover:text-[#0F1F33]'
                      }`}
                    >
                      <span>{dept}</span>
                      <span className="text-xs text-[#5A7A99]">{DEPARTMENT_COUNTS[dept] || 0}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Rating Filter */}
            <div className="bg-white rounded-2xl border border-[#CBD8E8] p-5 shadow-sm">
              <h3 className="font-serif font-semibold text-[#0F1F33] mb-4 text-sm uppercase tracking-wide">最低评分</h3>
              <div className="space-y-2">
                {[{ val: 0, label: '全部评分' }, { val: 4, label: '4分以上' }, { val: 4.5, label: '4.5分以上' }].map((r) => (
                  <label key={r.val} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="rating"
                      checked={filterRating === r.val}
                      onChange={() => setFilterRating(r.val)}
                      className="accent-[#1E3A5F]"
                    />
                    <span className="text-sm text-[#5A7A99] group-hover:text-[#0F1F33] transition-colors">
                      {r.val > 0 && <span className="text-[#F59E0B] mr-1">{'★'.repeat(Math.floor(r.val))}</span>}
                      {r.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Upload CTA */}
            <div className="bg-gradient-to-br from-[#1E3A5F] to-[#2D6A9F] rounded-2xl p-5 text-white">
              <div className="w-10 h-10 bg-[#F59E0B] rounded-xl flex items-center justify-center mb-3">
                <Upload className="w-5 h-5 text-[#1E3A5F]" />
              </div>
              <h4 className="font-serif font-bold text-base mb-2">分享你的笔记</h4>
              <p className="text-white/70 text-xs leading-relaxed mb-4">上传学习资料，帮助同学，同时积累贡献积分。</p>
              <button
                onClick={() => {}}
                className="w-full bg-[#F59E0B] hover:bg-yellow-400 text-[#1E3A5F] font-semibold text-sm py-2.5 rounded-xl transition-all"
              >
                立即上传
              </button>
            </div>

            {/* Download Quota */}
            {currentUser?.membershipType === 'free' && (
              <div className="bg-white rounded-2xl border border-[#CBD8E8] p-5 shadow-sm">
                <h3 className="font-serif font-semibold text-[#0F1F33] mb-3 text-sm">今日下载额度</h3>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[#5A7A99] text-xs">免费额度</span>
                  <span className="text-[#0F1F33] font-semibold text-sm">{quota.used} / {quota.total}</span>
                </div>
                <div className="w-full bg-[#F0F4F8] rounded-full h-2 mb-3">
                  <div
                    className="bg-[#F59E0B] h-2 rounded-full transition-all"
                    style={{ width: `${Math.min((quota.used / quota.total) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-[#5A7A99] text-xs mb-3">今日还可下载 {Math.max(quota.total - quota.used, 0)} 份</p>
                <button
                  onClick={onUpgrade}
                  className="w-full bg-[#1E3A5F] hover:bg-[#2D6A9F] text-white text-xs font-semibold py-2 rounded-lg transition-all"
                >
                  升级会员
                </button>
              </div>
            )}
          </aside>

          {/* MAIN CONTENT */}
          <div className="lg:col-span-3 space-y-8">
            {/* Trending */}
            {trending.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-6 bg-[#F59E0B] rounded-full" />
                    <h2 className="font-serif text-xl font-bold text-[#0F1F33]">🔥 本周热门资料</h2>
                  </div>
                  <TrendingUp className="w-5 h-5 text-[#F59E0B]" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {trending.map((m, idx) => (
                    <div
                      key={m.id}
                      onClick={() => onOpenDetail(m.id)}
                      className="bg-white rounded-2xl border border-[#CBD8E8] overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group cursor-pointer"
                    >
                      <div className="h-32 overflow-hidden relative">
                        <img
                          src={TRENDING_IMAGES[idx % TRENDING_IMAGES.length]}
                          alt={m.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#1E3A5F]/60 to-transparent" />
                        <span className="absolute top-3 left-3"><TypeBadge type={m.type} /></span>
                        <span className="absolute top-3 right-3"><FormatBadge format={m.fileFormat} /></span>
                      </div>
                      <div className="p-4">
                        <div className="text-[#5A7A99] text-xs mb-1 font-mono">{m.courseCode} · {m.department}</div>
                        <h3 className="font-semibold text-[#0F1F33] text-sm leading-snug mb-2 line-clamp-2">{m.title}</h3>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <StarRating rating={parseFloat(m.averageRating)} />
                            <span className="text-[#5A7A99] text-xs">{parseFloat(m.averageRating).toFixed(1)} ({m.ratingCount})</span>
                          </div>
                          <span className="text-[#5A7A99] text-xs flex items-center gap-1">
                            <Download className="w-3 h-3" />{m.downloadCount.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Material List */}
            <section>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-6 bg-[#2D6A9F] rounded-full" />
                  <h2 className="font-serif text-xl font-bold text-[#0F1F33]">最新上传资料</h2>
                </div>
                <span className="text-[#5A7A99] text-sm">共 {totalMaterials} 份</span>
              </div>

              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white rounded-2xl border border-[#CBD8E8] p-4 animate-pulse">
                      <div className="flex gap-4">
                        <div className="w-12 h-12 bg-[#F0F4F8] rounded-xl" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-[#F0F4F8] rounded w-3/4" />
                          <div className="h-3 bg-[#F0F4F8] rounded w-1/2" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : materials.length === 0 ? (
                <div className="bg-white rounded-2xl border border-[#CBD8E8] p-12 text-center">
                  <FileText className="w-12 h-12 text-[#CBD8E8] mx-auto mb-3" />
                  <p className="text-[#5A7A99]">暂无相关资料</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {materials.map((m) => (
                    <MaterialRow
                      key={m.id}
                      material={m}
                      isBookmarked={bookmarkedIds.has(m.id)}
                      onToggleBookmark={onToggleBookmark}
                      onDownload={onDownload}
                      onOpenDetail={onOpenDetail}
                    />
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="w-9 h-9 flex items-center justify-center rounded-lg border border-[#CBD8E8] text-[#5A7A99] hover:bg-white transition-colors disabled:opacity-40"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const p = i + 1;
                    return (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm transition-colors ${
                          page === p ? 'bg-[#1E3A5F] text-white font-semibold' : 'border border-[#CBD8E8] text-[#5A7A99] hover:bg-white'
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="w-9 h-9 flex items-center justify-center rounded-lg border border-[#CBD8E8] text-[#5A7A99] hover:bg-white transition-colors disabled:opacity-40"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </section>

            {/* Membership CTA */}
            <section className="bg-gradient-to-r from-[#1E3A5F] to-[#2D6A9F] rounded-2xl p-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
              <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-[#F59E0B] text-[#1E3A5F] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">付费会员</span>
                  </div>
                  <h3 className="font-serif text-2xl font-bold mb-2">解锁无限下载权限</h3>
                  <p className="text-white/70 text-sm leading-relaxed max-w-md">免费用户每日限下载 10 份。升级会员，享受无限制下载、高速通道。</p>
                  <div className="flex items-center gap-4 mt-3">
                    {['无限下载', '高速通道', '无广告体验'].map((f) => (
                      <div key={f} className="flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4 text-[#F59E0B]" />
                        <span className="text-white/80 text-xs">{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex-shrink-0 text-center">
                  <div className="text-white/60 text-xs mb-1">每月仅需</div>
                  <div className="font-serif text-4xl font-bold text-[#F59E0B]">¥9.9</div>
                  <div className="text-white/60 text-xs mb-4">/月</div>
                  <button className="bg-[#F59E0B] hover:bg-yellow-400 text-[#1E3A5F] font-bold px-8 py-3 rounded-xl transition-all shadow-lg text-sm">
                    立即升级
                  </button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="bg-[#1E3A5F] text-white mt-8">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 bg-[#F59E0B] rounded-lg flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-[#1E3A5F]" />
                </div>
                <span className="font-serif font-bold">StudyShare</span>
              </div>
              <p className="text-white/60 text-sm leading-relaxed">由学生共建的学习资料共享平台，让优质资源触手可及。</p>
            </div>
            <div>
              <h4 className="font-semibold text-sm uppercase tracking-wide mb-4">平台功能</h4>
              <ul className="space-y-2">
                {['浏览资料', '上传资料', '热门榜单', '个人资料库'].map((t) => (
                  <li key={t}><span className="text-white/60 text-sm">{t}</span></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm uppercase tracking-wide mb-4">支持</h4>
              <ul className="space-y-2">
                {['使用帮助', '版权政策', '举报内容', '联系我们'].map((t) => (
                  <li key={t}><span className="text-white/60 text-sm">{t}</span></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm uppercase tracking-wide mb-4">今日下载额度</h4>
              <div className="bg-white/10 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/70 text-xs">免费额度</span>
                  <span className="text-white font-semibold text-sm">
                    {quota.total === Infinity ? '无限' : `${quota.used} / ${quota.total}`}
                  </span>
                </div>
                {quota.total !== Infinity && (
                  <div className="w-full bg-white/20 rounded-full h-2 mb-3">
                    <div
                      className="bg-[#F59E0B] h-2 rounded-full"
                      style={{ width: `${Math.min((quota.used / quota.total) * 100, 100)}%` }}
                    />
                  </div>
                )}
                <p className="text-white/50 text-xs">
                  {quota.total === Infinity ? '会员无限下载' : `今日还可下载 ${Math.max(quota.total - quota.used, 0)} 份。`}
                </p>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-white/40 text-xs">© 2026 StudyShare. 保留所有权利。</p>
            <div className="flex items-center gap-4">
              {['隐私政策', '服务条款', 'Cookie 设置'].map((t) => (
                <span key={t} className="text-white/40 text-xs">{t}</span>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}

// ============================================================
// MATERIAL ROW
// ============================================================
function MaterialRow({
  material: m, isBookmarked, onToggleBookmark, onDownload, onOpenDetail,
}: {
  material: Material;
  isBookmarked: boolean;
  onToggleBookmark: (id: number, e: React.MouseEvent) => void;
  onDownload: (m: Material, e: React.MouseEvent) => void;
  onOpenDetail: (id: number) => void;
}) {
  const fileColors: Record<string, string> = {
    PDF: 'bg-red-50 border-red-100 text-red-500',
    DOCX: 'bg-blue-50 border-blue-100 text-blue-500',
    PPTX: 'bg-orange-50 border-orange-100 text-orange-500',
  };
  const colorClass = fileColors[m.fileFormat] || 'bg-gray-50 border-gray-100 text-gray-500';

  return (
    <div
      onClick={() => onOpenDetail(m.id)}
      className="bg-white rounded-2xl border border-[#CBD8E8] p-4 hover:shadow-md hover:border-[#2D6A9F]/40 transition-all duration-200 group cursor-pointer"
    >
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 border rounded-xl flex items-center justify-center flex-shrink-0 ${colorClass}`}>
          <FileText className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="font-mono text-xs text-[#2D6A9F] bg-[#2D6A9F]/10 px-2 py-0.5 rounded">{m.courseCode}</span>
                <TypeBadge type={m.type} />
                {m.status === 'flagged' && (
                  <span className="text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">已标记</span>
                )}
              </div>
              <h4 className="font-semibold text-[#0F1F33] text-sm group-hover:text-[#1E3A5F] transition-colors line-clamp-1">{m.title}</h4>
              <p className="text-[#5A7A99] text-xs mt-1">上传者：{m.uploaderName} · {m.semester || ''} {m.professor ? `· ${m.professor}` : ''}</p>
            </div>
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              <div className="flex items-center gap-1">
                <StarRating rating={parseFloat(m.averageRating)} />
                <span className="text-[#5A7A99] text-xs">{parseFloat(m.averageRating).toFixed(1)}</span>
              </div>
              <span className="text-[#5A7A99] text-xs flex items-center gap-1">
                <Download className="w-3 h-3" />{m.downloadCount.toLocaleString()}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4 mt-3">
            <button
              onClick={(e) => { e.stopPropagation(); onOpenDetail(m.id); }}
              className="flex items-center gap-1.5 text-[#2D6A9F] hover:text-[#1E3A5F] text-xs font-medium transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />预览
            </button>
            <button
              onClick={(e) => onDownload(m, e)}
              className="flex items-center gap-1.5 text-[#2D6A9F] hover:text-[#1E3A5F] text-xs font-medium transition-colors"
            >
              <Download className="w-3.5 h-3.5" />下载
            </button>
            <button
              onClick={(e) => onToggleBookmark(m.id, e)}
              className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
                isBookmarked ? 'text-[#F59E0B]' : 'text-[#5A7A99] hover:text-[#F59E0B]'
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-current' : ''}`} />收藏
            </button>
            <span className="ml-auto text-[#5A7A99] text-xs">{timeAgo(m.createdAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// DETAIL VIEW
// ============================================================
function DetailView({
  materialId, onBack, bookmarkedIds, onToggleBookmark, onDownload, currentUser,
}: {
  materialId: number;
  onBack: () => void;
  bookmarkedIds: Set<number>;
  onToggleBookmark: (id: number, e: React.MouseEvent) => void;
  onDownload: (m: Material, e: React.MouseEvent) => void;
  currentUser: User | null;
}) {
  const [material, setMaterial] = useState<Material | null>(null);
  const [reviews, setReviews] = useState<{ id: number; userName: string; rating: number; comment?: string; createdAt: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [showReport, setShowReport] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [mRes, rRes] = await Promise.all([
        apiService.getMaterial(materialId),
        apiService.getReviews(materialId),
      ]);
      if (mRes.success) setMaterial(mRes.data);
      if (rRes.success) setReviews(rRes.data);
      setLoading(false);
    };
    load();
  }, [materialId]);

  const handleReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const res = await apiService.createReview(materialId, { rating, comment });
    if (res.success) {
      toast.success('评价已提交');
      setComment('');
      const rRes = await apiService.getReviews(materialId);
      if (rRes.success) setReviews(rRes.data);
      const mRes = await apiService.getMaterial(materialId);
      if (mRes.success) setMaterial(mRes.data);
    } else {
      toast.error(res.message || '提交失败');
    }
    setSubmitting(false);
  };

  const handleReport = async () => {
    if (!reportReason) return;
    const res = await apiService.reportMaterial(materialId, { reason: reportReason });
    if (res.success) {
      toast.success('举报已提交，管理员将尽快审核');
      setShowReport(false);
    } else {
      toast.error(res.message || '举报失败');
    }
  };

  if (loading) {
    return (
      <div className="max-w-screen-xl mx-auto px-4 py-12 flex justify-center">
        <div className="w-8 h-8 border-4 border-[#1E3A5F] border-t-[#F59E0B] rounded-full animate-spin" />
      </div>
    );
  }

  if (!material) return null;

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-[#2D6A9F] hover:text-[#1E3A5F] text-sm font-medium mb-6 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />返回列表
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-[#CBD8E8] p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="font-mono text-xs text-[#2D6A9F] bg-[#2D6A9F]/10 px-2 py-0.5 rounded">{material.courseCode}</span>
                  <TypeBadge type={material.type} />
                  <span className="text-xs bg-[#F0F4F8] border border-[#CBD8E8] px-2 py-0.5 rounded-full text-[#5A7A99]">{material.fileFormat}</span>
                </div>
                <h1 className="font-serif text-2xl font-bold text-[#0F1F33] leading-tight">{material.title}</h1>
              </div>
              <button
                onClick={(e) => onToggleBookmark(material.id, e)}
                className={`p-2 rounded-xl transition-colors flex-shrink-0 ${
                  bookmarkedIds.has(material.id) ? 'bg-[#F59E0B]/10 text-[#F59E0B]' : 'bg-[#F0F4F8] text-[#5A7A99] hover:text-[#F59E0B]'
                }`}
              >
                <Bookmark className={`w-5 h-5 ${bookmarkedIds.has(material.id) ? 'fill-current' : ''}`} />
              </button>
            </div>

            {material.description && (
              <p className="text-[#5A7A99] text-sm leading-relaxed mb-4">{material.description}</p>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
              {[
                { label: '院系', value: material.department },
                { label: '学期', value: material.semester || '-' },
                { label: '教授', value: material.professor || '-' },
                { label: '上传者', value: material.uploaderName },
              ].map(({ label, value }) => (
                <div key={label} className="bg-[#F0F4F8] rounded-xl p-3">
                  <div className="text-[#5A7A99] text-xs mb-1">{label}</div>
                  <div className="text-[#0F1F33] text-sm font-medium truncate">{value}</div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-6 pt-4 border-t border-[#CBD8E8]">
              <div className="flex items-center gap-2">
                <StarRating rating={parseFloat(material.averageRating)} size="md" />
                <span className="font-bold text-[#0F1F33]">{parseFloat(material.averageRating).toFixed(1)}</span>
                <span className="text-[#5A7A99] text-sm">({material.ratingCount} 评价)</span>
              </div>
              <div className="flex items-center gap-1.5 text-[#5A7A99] text-sm">
                <Download className="w-4 h-4" />{material.downloadCount.toLocaleString()} 下载
              </div>
            </div>
          </div>

          {/* Preview placeholder */}
          <div className="bg-white rounded-2xl border border-[#CBD8E8] p-6 shadow-sm">
            <h3 className="font-serif font-bold text-[#0F1F33] mb-4 flex items-center gap-2">
              <Eye className="w-5 h-5 text-[#2D6A9F]" />资料预览
            </h3>
            <div className="bg-[#F0F4F8] rounded-xl h-48 flex items-center justify-center">
              <div className="text-center">
                <FileText className="w-12 h-12 text-[#CBD8E8] mx-auto mb-2" />
                <p className="text-[#5A7A99] text-sm">{material.fileFormat} 文件预览</p>
                <p className="text-[#5A7A99] text-xs mt-1">下载后可查看完整内容</p>
              </div>
            </div>
          </div>

          {/* Reviews */}
          <div className="bg-white rounded-2xl border border-[#CBD8E8] p-6 shadow-sm">
            <h3 className="font-serif font-bold text-[#0F1F33] mb-5 flex items-center gap-2">
              <Star className="w-5 h-5 text-[#F59E0B]" />用户评价 ({reviews.length})
            </h3>

            {/* Submit Review */}
            <form onSubmit={handleReview} className="bg-[#F0F4F8] rounded-xl p-4 mb-5">
              <p className="text-sm font-medium text-[#0F1F33] mb-3">发表评价</p>
              <div className="flex items-center gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setRating(s)}
                    className={`text-2xl transition-colors ${s <= rating ? 'text-[#F59E0B]' : 'text-gray-300'}`}
                  >
                    ★
                  </button>
                ))}
                <span className="text-[#5A7A99] text-sm ml-2">{rating} 星</span>
              </div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="分享你对这份资料的看法…"
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-[#CBD8E8] text-sm text-[#0F1F33] placeholder-[#5A7A99] outline-none focus:border-[#2D6A9F] resize-none"
              />
              <button
                type="submit"
                disabled={submitting}
                className="mt-2 bg-[#1E3A5F] hover:bg-[#2D6A9F] text-white text-sm font-semibold px-5 py-2 rounded-lg transition-all disabled:opacity-60"
              >
                {submitting ? '提交中…' : '提交评价'}
              </button>
            </form>

            {reviews.length === 0 ? (
              <p className="text-[#5A7A99] text-sm text-center py-4">暂无评价，成为第一个评价者！</p>
            ) : (
              <div className="space-y-4">
                {reviews.map((r) => (
                  <div key={r.id} className="border-b border-[#CBD8E8] pb-4 last:border-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm text-[#0F1F33]">{r.userName}</span>
                      <span className="text-[#5A7A99] text-xs">{timeAgo(r.createdAt)}</span>
                    </div>
                    <StarRating rating={r.rating} />
                    {r.comment && <p className="text-[#5A7A99] text-sm mt-1">{r.comment}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-[#CBD8E8] p-5 shadow-sm">
            <button
              onClick={(e) => onDownload(material, e)}
              className="w-full bg-[#1E3A5F] hover:bg-[#2D6A9F] text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 mb-3"
            >
              <Download className="w-5 h-5" />下载资料
            </button>
            <button
              onClick={(e) => onToggleBookmark(material.id, e)}
              className={`w-full font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 border ${
                bookmarkedIds.has(material.id)
                  ? 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/30'
                  : 'bg-[#F0F4F8] text-[#5A7A99] border-[#CBD8E8] hover:border-[#F59E0B] hover:text-[#F59E0B]'
              }`}
            >
              <Bookmark className={`w-5 h-5 ${bookmarkedIds.has(material.id) ? 'fill-current' : ''}`} />
              {bookmarkedIds.has(material.id) ? '已收藏' : '添加收藏'}
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-[#CBD8E8] p-5 shadow-sm">
            <h4 className="font-serif font-semibold text-[#0F1F33] mb-3 text-sm">资料信息</h4>
            <dl className="space-y-2">
              {[
                ['上传时间', timeAgo(material.createdAt)],
                ['文件格式', material.fileFormat],
                ['下载次数', material.downloadCount.toLocaleString()],
                ['评价数量', material.ratingCount.toString()],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <dt className="text-[#5A7A99] text-xs">{k}</dt>
                  <dd className="text-[#0F1F33] text-xs font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Report */}
          <div className="bg-white rounded-2xl border border-[#CBD8E8] p-5 shadow-sm">
            <button
              onClick={() => setShowReport(!showReport)}
              className="flex items-center gap-2 text-[#5A7A99] hover:text-red-500 text-sm transition-colors"
            >
              <Flag className="w-4 h-4" />举报该资料
            </button>
            {showReport && (
              <div className="mt-3 space-y-2">
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full text-sm border border-[#CBD8E8] rounded-lg px-3 py-2 outline-none text-[#0F1F33]"
                >
                  <option value="">选择举报原因</option>
                  <option value="copyright">版权侵权</option>
                  <option value="inappropriate">不当内容</option>
                  <option value="spam">广告垃圾</option>
                  <option value="wrong_info">信息错误</option>
                </select>
                <button
                  onClick={handleReport}
                  disabled={!reportReason}
                  className="w-full bg-red-500 hover:bg-red-600 text-white text-sm font-semibold py-2 rounded-lg transition-all disabled:opacity-40"
                >
                  提交举报
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// UPLOAD VIEW
// ============================================================
function UploadView({ onSuccess, currentUser }: { onSuccess: () => void; currentUser: User | null }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [department, setDepartment] = useState('');
  const [type, setType] = useState<'notes' | 'exam' | 'guide' | 'slides'>('notes');
  const [fileFormat, setFileFormat] = useState<'PDF' | 'DOCX' | 'PPTX'>('PDF');
  const [semester, setSemester] = useState('');
  const [professor, setProfessor] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!title || !courseCode || !department) {
      setError('请填写标题、课程代码和院系');
      return;
    }
    setSubmitting(true);
    const res = await apiService.createMaterial({ title, description, courseCode, department, type, fileFormat, semester, professor });
    if (res.success) {
      toast.success('资料上传成功！', { description: '已添加到平台资料库' });
      onSuccess();
    } else {
      setError(res.message || '上传失败');
    }
    setSubmitting(false);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-[#0F1F33] mb-2">上传学习资料</h1>
        <p className="text-[#5A7A99]">分享你的笔记和资料，帮助更多同学</p>
      </div>

      {/* Copyright notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-amber-800 text-sm font-medium">版权提示</p>
          <p className="text-amber-700 text-xs mt-1">请确保上传的资料为您本人创作或已获得分享权限。上传侵权内容将导致账户封禁。</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#CBD8E8] p-6 shadow-sm">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-[#0F1F33] mb-1.5">资料标题 *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例：数据结构与算法完整笔记（2024秋）"
              className="w-full px-4 py-3 rounded-xl border border-[#CBD8E8] text-[#0F1F33] placeholder-[#5A7A99] text-sm outline-none focus:border-[#2D6A9F] focus:ring-2 focus:ring-[#2D6A9F]/20 transition-all"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#0F1F33] mb-1.5">课程代码 *</label>
              <input
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value)}
                placeholder="例：CS201"
                className="w-full px-4 py-3 rounded-xl border border-[#CBD8E8] text-[#0F1F33] placeholder-[#5A7A99] text-sm outline-none focus:border-[#2D6A9F] focus:ring-2 focus:ring-[#2D6A9F]/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0F1F33] mb-1.5">院系 *</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-[#CBD8E8] text-[#0F1F33] text-sm outline-none focus:border-[#2D6A9F] bg-white"
              >
                <option value="">选择院系</option>
                {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#0F1F33] mb-1.5">资料类型</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as 'notes' | 'exam' | 'guide' | 'slides')}
                className="w-full px-4 py-3 rounded-xl border border-[#CBD8E8] text-[#0F1F33] text-sm outline-none focus:border-[#2D6A9F] bg-white"
              >
                <option value="notes">课堂笔记</option>
                <option value="exam">历年真题</option>
                <option value="guide">学习指南</option>
                <option value="slides">PPT 课件</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0F1F33] mb-1.5">文件格式</label>
              <select
                value={fileFormat}
                onChange={(e) => setFileFormat(e.target.value as 'PDF' | 'DOCX' | 'PPTX')}
                className="w-full px-4 py-3 rounded-xl border border-[#CBD8E8] text-[#0F1F33] text-sm outline-none focus:border-[#2D6A9F] bg-white"
              >
                <option value="PDF">PDF</option>
                <option value="DOCX">DOCX</option>
                <option value="PPTX">PPTX</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#0F1F33] mb-1.5">学期</label>
              <input
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                placeholder="例：2024秋季"
                className="w-full px-4 py-3 rounded-xl border border-[#CBD8E8] text-[#0F1F33] placeholder-[#5A7A99] text-sm outline-none focus:border-[#2D6A9F] transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0F1F33] mb-1.5">教授</label>
              <input
                value={professor}
                onChange={(e) => setProfessor(e.target.value)}
                placeholder="例：王教授"
                className="w-full px-4 py-3 rounded-xl border border-[#CBD8E8] text-[#0F1F33] placeholder-[#5A7A99] text-sm outline-none focus:border-[#2D6A9F] transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#0F1F33] mb-1.5">资料描述</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="简要描述资料内容和适用范围…"
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-[#CBD8E8] text-[#0F1F33] placeholder-[#5A7A99] text-sm outline-none focus:border-[#2D6A9F] resize-none transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-[#1E3A5F] hover:bg-[#2D6A9F] text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 min-h-[48px] disabled:opacity-60"
          >
            {submitting ? (
              <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />上传中…</>
            ) : (
              <><Upload className="w-5 h-5" />提交资料</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

// ============================================================
// BOOKMARKS VIEW
// ============================================================
function BookmarksView({
  onOpenDetail, onToggleBookmark, bookmarkedIds,
}: {
  onOpenDetail: (id: number) => void;
  onToggleBookmark: (id: number, e: React.MouseEvent) => void;
  bookmarkedIds: Set<number>;
}) {
  const [bookmarks, setBookmarks] = useState<{ id: number; materialId: number; material?: Material; createdAt: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const res = await apiService.getBookmarks();
      if (res.success) setBookmarks(res.data as { id: number; materialId: number; material?: Material; createdAt: string }[]);
      setLoading(false);
    };
    load();
  }, [bookmarkedIds]);

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-[#0F1F33] mb-2">我的收藏</h1>
        <p className="text-[#5A7A99]">已收藏 {bookmarks.length} 份资料</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-[#1E3A5F] border-t-[#F59E0B] rounded-full animate-spin" />
        </div>
      ) : bookmarks.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#CBD8E8] p-12 text-center">
          <BookMarked className="w-12 h-12 text-[#CBD8E8] mx-auto mb-3" />
          <p className="text-[#5A7A99] font-medium">暂无收藏资料</p>
          <p className="text-[#5A7A99] text-sm mt-1">浏览资料并点击收藏按鈕</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bookmarks.map((bm) => bm.material && (
            <MaterialRow
              key={bm.id}
              material={bm.material}
              isBookmarked={bookmarkedIds.has(bm.materialId)}
              onToggleBookmark={onToggleBookmark}
              onDownload={async (m, e) => {
                e.stopPropagation();
                const res = await apiService.downloadMaterial(m.id);
                if (res.success) toast.success('下载成功');
                else toast.error(res.message || '下载失败');
              }}
              onOpenDetail={onOpenDetail}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// PROFILE VIEW
// ============================================================
function ProfileView({
  currentUser, onRefreshUser, onOpenDetail,
}: {
  currentUser: User | null;
  onRefreshUser: () => void;
  onOpenDetail: (id: number) => void;
}) {
  const [tab, setTab] = useState<'profile' | 'uploads' | 'downloads'>('profile');
  const [name, setName] = useState(currentUser?.name || '');
  const [major, setMajor] = useState(currentUser?.major || '');
  const [department, setDepartment] = useState(currentUser?.department || '');
  const [graduationYear, setGraduationYear] = useState(currentUser?.graduationYear?.toString() || '');
  const [saving, setSaving] = useState(false);
  const [uploads, setUploads] = useState<Material[]>([]);
  const [downloads, setDownloads] = useState<{ id: number; materialTitle: string; createdAt: string }[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    if (tab === 'uploads') {
      apiService.getMyUploads().then((res) => {
        if (res.success) setUploads(res.data);
        setLoadingData(false);
      });
    } else if (tab === 'downloads') {
      apiService.getDownloadHistory().then((res) => {
        if (res.success) setDownloads(res.data as { id: number; materialTitle: string; createdAt: string }[]);
        setLoadingData(false);
      });
    }
  }, [tab]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await apiService.updateProfile({
      name,
      major: major || undefined,
      department: department || undefined,
      graduationYear: graduationYear ? parseInt(graduationYear) : undefined,
    });
    if (res.success) {
      toast.success('个人档案已更新');
      onRefreshUser();
    } else {
      toast.error('更新失败');
    }
    setSaving(false);
  };

  const handleDeleteUpload = async (id: number) => {
    const res = await apiService.deleteMaterial(id);
    if (res.success) {
      toast.success('资料已删除');
      setUploads((prev) => prev.filter((m) => m.id !== id));
    } else {
      toast.error(res.message || '删除失败');
    }
  };

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-[#0F1F33] mb-2">个人中心</h1>
        <p className="text-[#5A7A99]">管理个人档案、上传记录和下载历史</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-xl border border-[#CBD8E8] p-1 mb-6 w-fit">
        {[{ id: 'profile', label: '个人档案', icon: <Settings className="w-4 h-4" /> },
          { id: 'uploads', label: '我的上传', icon: <Upload className="w-4 h-4" /> },
          { id: 'downloads', label: '下载历史', icon: <Clock className="w-4 h-4" /> }].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as 'profile' | 'uploads' | 'downloads')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.id ? 'bg-[#1E3A5F] text-white' : 'text-[#5A7A99] hover:text-[#0F1F33]'
            }`}
          >
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-[#CBD8E8] p-6 shadow-sm">
              <h3 className="font-serif font-bold text-[#0F1F33] mb-5 flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-[#2D6A9F]" />编辑个人信息
              </h3>
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#0F1F33] mb-1.5">姓名</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-[#CBD8E8] text-[#0F1F33] text-sm outline-none focus:border-[#2D6A9F] focus:ring-2 focus:ring-[#2D6A9F]/20 transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#0F1F33] mb-1.5">专业</label>
                    <input
                      value={major}
                      onChange={(e) => setMajor(e.target.value)}
                      placeholder="例：计算机科学与技术"
                      className="w-full px-4 py-3 rounded-xl border border-[#CBD8E8] text-[#0F1F33] placeholder-[#5A7A99] text-sm outline-none focus:border-[#2D6A9F] transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#0F1F33] mb-1.5">院系</label>
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-[#CBD8E8] text-[#0F1F33] text-sm outline-none focus:border-[#2D6A9F] bg-white"
                    >
                      <option value="">选择院系</option>
                      {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#0F1F33] mb-1.5">预计毕业年份</label>
                  <input
                    type="number"
                    value={graduationYear}
                    onChange={(e) => setGraduationYear(e.target.value)}
                    placeholder="例：2026"
                    min={2020}
                    max={2035}
                    className="w-full px-4 py-3 rounded-xl border border-[#CBD8E8] text-[#0F1F33] placeholder-[#5A7A99] text-sm outline-none focus:border-[#2D6A9F] transition-all"
                  />
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-[#1E3A5F] hover:bg-[#2D6A9F] text-white font-semibold px-6 py-3 rounded-xl transition-all flex items-center gap-2 disabled:opacity-60"
                >
                  {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  保存修改
                </button>
              </form>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-[#CBD8E8] p-5 shadow-sm">
              <h4 className="font-serif font-semibold text-[#0F1F33] mb-4">账户信息</h4>
              <dl className="space-y-3">
                {[
                  ['邮箱', currentUser?.email || '-'],
                  ['身份', currentUser?.role === 'admin' ? '管理员' : '学生'],
                  ['会员类型', currentUser?.membershipType === 'premium' ? '付费会员' : '免费用户'],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between items-center">
                    <dt className="text-[#5A7A99] text-sm">{k}</dt>
                    <dd className="text-[#0F1F33] text-sm font-medium">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {currentUser?.membershipType === 'free' && (
              <div className="bg-gradient-to-br from-[#1E3A5F] to-[#2D6A9F] rounded-2xl p-5 text-white">
                <h4 className="font-serif font-bold mb-2">升级会员</h4>
                <p className="text-white/70 text-xs mb-3">无限下载 + 高速通道</p>
                <div className="font-serif text-2xl font-bold text-[#F59E0B] mb-3">¥9.9/月</div>
                <button className="w-full bg-[#F59E0B] hover:bg-yellow-400 text-[#1E3A5F] font-bold text-sm py-2.5 rounded-xl transition-all">
                  立即升级
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'uploads' && (
        <div>
          {loadingData ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-[#1E3A5F] border-t-[#F59E0B] rounded-full animate-spin" />
            </div>
          ) : uploads.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#CBD8E8] p-12 text-center">
              <Upload className="w-12 h-12 text-[#CBD8E8] mx-auto mb-3" />
              <p className="text-[#5A7A99] font-medium">暂无上传记录</p>
            </div>
          ) : (
            <div className="space-y-3">
              {uploads.map((m) => (
                <div key={m.id} className="bg-white rounded-2xl border border-[#CBD8E8] p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-mono text-xs text-[#2D6A9F] bg-[#2D6A9F]/10 px-2 py-0.5 rounded">{m.courseCode}</span>
                        <TypeBadge type={m.type} />
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          m.status === 'approved' ? 'bg-green-50 text-green-600' :
                          m.status === 'flagged' ? 'bg-orange-50 text-orange-600' :
                          m.status === 'rejected' ? 'bg-red-50 text-red-600' :
                          'bg-gray-50 text-gray-600'
                        }`}>
                          {m.status === 'approved' ? '已审核' : m.status === 'flagged' ? '已标记' : m.status === 'rejected' ? '已拒绝' : '待审核'}
                        </span>
                      </div>
                      <h4 className="font-semibold text-[#0F1F33] text-sm line-clamp-1">{m.title}</h4>
                      <div className="flex items-center gap-4 mt-2 text-xs text-[#5A7A99]">
                        <span className="flex items-center gap-1"><Download className="w-3 h-3" />{m.downloadCount}</span>
                        <span className="flex items-center gap-1"><Star className="w-3 h-3" />{parseFloat(m.averageRating).toFixed(1)}</span>
                        <span>{timeAgo(m.createdAt)}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteUpload(m.id)}
                      className="p-2 text-[#5A7A99] hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'downloads' && (
        <div>
          {loadingData ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-[#1E3A5F] border-t-[#F59E0B] rounded-full animate-spin" />
            </div>
          ) : downloads.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#CBD8E8] p-12 text-center">
              <Clock className="w-12 h-12 text-[#CBD8E8] mx-auto mb-3" />
              <p className="text-[#5A7A99] font-medium">暂无下载记录</p>
            </div>
          ) : (
            <div className="space-y-2">
              {downloads.map((d) => (
                <div key={d.id} className="bg-white rounded-xl border border-[#CBD8E8] p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-[#F0F4F8] rounded-lg flex items-center justify-center">
                      <Download className="w-4 h-4 text-[#2D6A9F]" />
                    </div>
                    <div>
                      <p className="text-[#0F1F33] text-sm font-medium line-clamp-1">{d.materialTitle}</p>
                      <p className="text-[#5A7A99] text-xs">{timeAgo(d.createdAt)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// ADMIN VIEW
// ============================================================
function AdminView() {
  const [tab, setTab] = useState<'flagged' | 'pending' | 'reports'>('flagged');
  const [flagged, setFlagged] = useState<Material[]>([]);
  const [pending, setPending] = useState<Material[]>([]);
  const [reports, setReports] = useState<{ id: number; materialId: number; reason: string; description?: string; status: string; createdAt: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async (t: typeof tab) => {
    setLoading(true);
    if (t === 'flagged') {
      const res = await apiService.getAdminFlagged();
      if (res.success) setFlagged(res.data);
    } else if (t === 'pending') {
      const res = await apiService.getAdminPending();
      if (res.success) setPending(res.data);
    } else {
      const res = await apiService.getAdminReports();
      if (res.success) setReports(res.data as { id: number; materialId: number; reason: string; description?: string; status: string; createdAt: string }[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      if (tab === 'flagged') {
        const res = await apiService.getAdminFlagged();
        if (!cancelled && res.success) setFlagged(res.data);
      } else if (tab === 'pending') {
        const res = await apiService.getAdminPending();
        if (!cancelled && res.success) setPending(res.data);
      } else {
        const res = await apiService.getAdminReports();
        if (!cancelled && res.success) setReports(res.data as { id: number; materialId: number; reason: string; description?: string; status: string; createdAt: string }[]);
      }
      if (!cancelled) setLoading(false);
    };
    run();
    return () => { cancelled = true; };
  }, [tab]);

  const handleMaterialStatus = async (id: number, status: string) => {
    const res = await apiService.updateMaterialStatus(id, status);
    if (res.success) {
      toast.success(`资料状态已更新为 ${status}`);
      loadData(tab);
    }
  };

  const handleReportStatus = async (id: number, status: string) => {
    const res = await apiService.updateReportStatus(id, status);
    if (res.success) {
      toast.success('举报状态已更新');
      loadData(tab);
    }
  };

  const REASON_LABELS: Record<string, string> = {
    copyright: '版权侵权',
    inappropriate: '不当内容',
    spam: '广告垃圾',
    wrong_info: '信息错误',
  };

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-[#0F1F33] mb-2 flex items-center gap-3">
          <Shield className="w-8 h-8 text-[#1E3A5F]" />管理员审核看板
        </h1>
        <p className="text-[#5A7A99]">审核被标记内容和用户举报</p>
      </div>

      <div className="flex gap-1 bg-white rounded-xl border border-[#CBD8E8] p-1 mb-6 w-fit">
        {[{ id: 'flagged', label: '已标记资料', count: flagged.length },
          { id: 'pending', label: '待审核', count: pending.length },
          { id: 'reports', label: '举报记录', count: reports.length }].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as 'flagged' | 'pending' | 'reports')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.id ? 'bg-[#1E3A5F] text-white' : 'text-[#5A7A99] hover:text-[#0F1F33]'
            }`}
          >
            {t.label}
            {t.count > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                tab === t.id ? 'bg-white/20 text-white' : 'bg-red-100 text-red-600'
              }`}>{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-[#1E3A5F] border-t-[#F59E0B] rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {(tab === 'flagged' || tab === 'pending') && (
            <div className="space-y-3">
              {(tab === 'flagged' ? flagged : pending).length === 0 ? (
                <div className="bg-white rounded-2xl border border-[#CBD8E8] p-12 text-center">
                  <CheckCircle className="w-12 h-12 text-green-300 mx-auto mb-3" />
                  <p className="text-[#5A7A99]">暂无待处理资料</p>
                </div>
              ) : (
                (tab === 'flagged' ? flagged : pending).map((m) => (
                  <div key={m.id} className="bg-white rounded-2xl border border-[#CBD8E8] p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-mono text-xs text-[#2D6A9F] bg-[#2D6A9F]/10 px-2 py-0.5 rounded">{m.courseCode}</span>
                          <TypeBadge type={m.type} />
                          <span className="text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full">{m.status}</span>
                        </div>
                        <h4 className="font-semibold text-[#0F1F33] text-sm">{m.title}</h4>
                        <p className="text-[#5A7A99] text-xs mt-1">上传者：{m.uploaderName} · {timeAgo(m.createdAt)}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleMaterialStatus(m.id, 'approved')}
                          className="flex items-center gap-1 bg-green-50 hover:bg-green-100 text-green-600 text-xs font-medium px-3 py-1.5 rounded-lg transition-all"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />通过
                        </button>
                        <button
                          onClick={() => handleMaterialStatus(m.id, 'rejected')}
                          className="flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-medium px-3 py-1.5 rounded-lg transition-all"
                        >
                          <XCircle className="w-3.5 h-3.5" />拒绝
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === 'reports' && (
            <div className="space-y-3">
              {reports.length === 0 ? (
                <div className="bg-white rounded-2xl border border-[#CBD8E8] p-12 text-center">
                  <CheckCircle className="w-12 h-12 text-green-300 mx-auto mb-3" />
                  <p className="text-[#5A7A99]">暂无举报记录</p>
                </div>
              ) : (
                reports.map((r) => (
                  <div key={r.id} className="bg-white rounded-2xl border border-[#CBD8E8] p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Flag className="w-4 h-4 text-red-500" />
                          <span className="font-medium text-sm text-[#0F1F33]">{REASON_LABELS[r.reason] || r.reason}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            r.status === 'pending' ? 'bg-orange-50 text-orange-600' :
                            r.status === 'resolved' ? 'bg-green-50 text-green-600' :
                            'bg-gray-50 text-gray-600'
                          }`}>{r.status === 'pending' ? '待处理' : r.status === 'resolved' ? '已处理' : '已驳回'}</span>
                        </div>
                        <p className="text-[#5A7A99] text-xs">资料 ID: {r.materialId} · {timeAgo(r.createdAt)}</p>
                        {r.description && <p className="text-[#5A7A99] text-xs mt-1">{r.description}</p>}
                      </div>
                      {r.status === 'pending' && (
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => handleReportStatus(r.id, 'resolved')}
                            className="flex items-center gap-1 bg-green-50 hover:bg-green-100 text-green-600 text-xs font-medium px-3 py-1.5 rounded-lg transition-all"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />处理
                          </button>
                          <button
                            onClick={() => handleReportStatus(r.id, 'dismissed')}
                            className="flex items-center gap-1 bg-gray-50 hover:bg-gray-100 text-gray-600 text-xs font-medium px-3 py-1.5 rounded-lg transition-all"
                          >
                            <XCircle className="w-3.5 h-3.5" />驳回
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
