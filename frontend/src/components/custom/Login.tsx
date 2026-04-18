import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/lib/api';
import { toast } from 'sonner';
import { BookOpen, Eye, EyeOff, Loader2 } from 'lucide-react';

const Login = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    if (!email || !password) {
      setError('请填写所有字段');
      return;
    }
    setLoading(true);
    try {
      const data = await apiService.login({ email, password });
      if (data.success && data.data?.token) {
        login(data.data.token);
        toast.success('登录成功', { description: `欢迎回来，${data.data.user.name}！` });
        navigate('/', { replace: true });
      } else {
        setError(data.message || '登录失败');
      }
    } catch {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F4F8] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-[#1E3A5F] rounded-xl flex items-center justify-center">
              <BookOpen className="w-7 h-7 text-[#F59E0B]" />
            </div>
            <span className="font-serif text-2xl font-bold text-[#1E3A5F]">StudyShare</span>
          </div>
          <h1 className="text-2xl font-bold text-[#0F1F33] mb-1">登录账户</h1>
          <p className="text-[#5A7A99] text-sm">登录后可访问全部学习资料</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-[#CBD8E8] p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[#0F1F33] mb-1.5">邮箱地址</label>
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
                  placeholder="输入密码"
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
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1E3A5F] hover:bg-[#2D6A9F] text-white font-semibold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 min-h-[48px] disabled:opacity-60"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : '登录'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-[#5A7A99] text-sm">
              还没有账户？{' '}
              <Link to="/signup" className="text-[#2D6A9F] hover:text-[#1E3A5F] font-medium transition-colors">
                免费注册
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-[#5A7A99] text-xs mt-6">
          登录即表示您同意我们的服务条款和隐私政策
        </p>
      </div>
    </div>
  );
};

export default Login;
