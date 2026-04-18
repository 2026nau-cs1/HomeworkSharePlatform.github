import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/lib/api';
import { toast } from 'sonner';
import { BookOpen, Eye, EyeOff, Loader2 } from 'lucide-react';

const Signup = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated === true) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name || !email || !password || !confirmPassword) {
      setError('请填写所有字段');
      return;
    }
    if (password !== confirmPassword) {
      setError('两次密码不一致');
      return;
    }
    if (password.length < 6) {
      setError('密码至少6位');
      return;
    }
    setLoading(true);
    try {
      const data = await apiService.signup({ name, email, password, confirmPassword });
      if (data.success && data.data?.token) {
        login(data.data.token);
        toast.success('注册成功', { description: `欢迎加入 StudyShare，${data.data.user.name}！` });
        navigate('/', { replace: true });
      } else {
        setError(data.message || '注册失败');
      }
    } catch {
      setError('网络错误，请程后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F4F8] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-[#1E3A5F] rounded-xl flex items-center justify-center">
              <BookOpen className="w-7 h-7 text-[#F59E0B]" />
            </div>
            <span className="font-serif text-2xl font-bold text-[#1E3A5F]">StudyShare</span>
          </div>
          <h1 className="text-2xl font-bold text-[#0F1F33] mb-1">创建账户</h1>
          <p className="text-[#5A7A99] text-sm">加入 5,000+ 同学的学习社区</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-[#CBD8E8] p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#0F1F33] mb-1.5">姓名</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="输入您的姓名"
                className="w-full px-4 py-3 rounded-xl border border-[#CBD8E8] text-[#0F1F33] placeholder-[#5A7A99] text-sm outline-none focus:border-[#2D6A9F] focus:ring-2 focus:ring-[#2D6A9F]/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0F1F33] mb-1.5">学校邮箱</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@university.edu"
                className="w-full px-4 py-3 rounded-xl border border-[#CBD8E8] text-[#0F1F33] placeholder-[#5A7A99] text-sm outline-none focus:border-[#2D6A9F] focus:ring-2 focus:ring-[#2D6A9F]/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0F1F33] mb-1.5">密码</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="至少6位"
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-[#CBD8E8] text-[#0F1F33] placeholder-[#5A7A99] text-sm outline-none focus:border-[#2D6A9F] focus:ring-2 focus:ring-[#2D6A9F]/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5A7A99] hover:text-[#1E3A5F] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0F1F33] mb-1.5">确认密码</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="再次输入密码"
                className="w-full px-4 py-3 rounded-xl border border-[#CBD8E8] text-[#0F1F33] placeholder-[#5A7A99] text-sm outline-none focus:border-[#2D6A9F] focus:ring-2 focus:ring-[#2D6A9F]/20 transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#F59E0B] hover:bg-yellow-400 text-[#1E3A5F] font-bold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 min-h-[48px] disabled:opacity-60 mt-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : '免费注册'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-[#5A7A99] text-sm">
              已有账户？{' '}
              <Link to="/login" className="text-[#2D6A9F] hover:text-[#1E3A5F] font-medium transition-colors">
                登录
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-[#5A7A99] text-xs mt-6">
          注册即表示您同意我们的服务条款和隐私政策
        </p>
      </div>
    </div>
  );
};

export default Signup;
