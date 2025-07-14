import { getTranslations } from 'next-intl/server';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;
  const t = await getTranslations({
    locale,
    namespace: 'Dashboard',
  });

  return {
    title: t('meta_title'),
  };
}

// Mock data - in production, this would come from your API/database
const dashboardData = {
  stats: {
    totalRevenue: 45231,
    totalUsers: 2350,
    totalOrders: 12234,
    conversionRate: 3.24,
  },
  chartData: {
    revenue: [4000, 3000, 2000, 2780, 1890, 2390, 3490],
    users: [240, 139, 980, 390, 480, 620, 750],
    orders: [120, 90, 180, 150, 240, 310, 400],
  },
  recentActivity: [
    { id: 1, type: 'order', description: 'New order #12234', time: '2 minutes ago', amount: 234.00 },
    { id: 2, type: 'user', description: 'New user registration', time: '5 minutes ago' },
    { id: 3, type: 'payment', description: 'Payment received', time: '10 minutes ago', amount: 1250.00 },
    { id: 4, type: 'order', description: 'Order #12233 completed', time: '15 minutes ago', amount: 89.99 },
    { id: 5, type: 'refund', description: 'Refund processed', time: '1 hour ago', amount: 156.00 },
  ],
};

function StatCard({ title, value, change, icon }: { title: string; value: string; change: string; icon: string }) {
  const isPositive = change.startsWith('+');
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-text-faded">{title}</p>
          <p className="u-display-s text-text-main">{value}</p>
        </div>
        <div className="text-2xl">{icon}</div>
      </div>
      <div className="mt-4">
        <span className={`text-sm font-medium ${isPositive ? 'text-swatch-cactus' : 'text-primary'}`}>
          {change}
        </span>
        <span className="text-sm text-text-faded ml-1">from last month</span>
      </div>
    </Card>
  );
}

function SimpleChart({ data, title, color = 'primary' }: { data: number[]; title: string; color?: string }) {
  const max = Math.max(...data);
  const colorClasses = {
    primary: 'bg-primary',
    cactus: 'bg-swatch-cactus',
    fig: 'bg-swatch-fig',
    sky: 'bg-swatch-sky',
  };

  return (
    <Card>
      <CardHeader>
        <h3 className="u-display-s text-text-main">{title}</h3>
      </CardHeader>
      <CardContent>
        <div className="flex items-end space-x-2 h-40">
          {data.map((value, index) => (
            <div key={`chart-bar-${index}`} className="flex-1 flex flex-col items-center">
              <div
                className={`w-full ${colorClasses[color as keyof typeof colorClasses]} rounded-t opacity-80 hover:opacity-100 transition-opacity`}
                style={{ height: `${(value / max) * 100}%` }}
              />
              <span className="text-xs text-text-faded mt-2">{`Day ${index + 1}`}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ActivityTimeline() {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'order': return '📦';
      case 'user': return '👤';
      case 'payment': return '💳';
      case 'refund': return '💸';
      default: return '📄';
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'order': return 'bg-swatch-sky/20 text-swatch-sky';
      case 'user': return 'bg-swatch-cactus/20 text-swatch-cactus';
      case 'payment': return 'bg-swatch-fig/20 text-swatch-fig';
      case 'refund': return 'bg-primary/20 text-primary';
      default: return 'bg-background-ivory-medium text-text-faded';
    }
  };

  return (
    <Card>
      <CardHeader>
        <h3 className="u-display-s text-text-main">Recent Activity</h3>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {dashboardData.recentActivity.map(activity => (
            <div key={activity.id} className="flex items-center space-x-4">
              <div className={`p-3 rounded-full ${getActivityColor(activity.type)}`}>
                <span className="text-sm">{getActivityIcon(activity.type)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-main">{activity.description}</p>
                <p className="text-sm text-text-faded">{activity.time}</p>
              </div>
              {activity.amount && (
                <div className="text-sm font-semibold text-text-main">
                  $
                  {activity.amount.toFixed(2)}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function QuickActions() {
  const actions = [
    { title: 'Create New Order', icon: '➕', variant: 'primary' as const },
    { title: 'Add User', icon: '👥', variant: 'secondary' as const },
    { title: 'Generate Report', icon: '📊', variant: 'primary' as const },
    { title: 'View Analytics', icon: '📈', variant: 'secondary' as const },
  ];

  return (
    <Card>
      <CardHeader>
        <h3 className="u-display-s text-text-main">Quick Actions</h3>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-3">
          {actions.map(action => (
            <Button
              key={action.title}
              variant={action.variant}
              className="justify-start space-x-3 h-auto py-4"
            >
              <span className="text-xl">{action.icon}</span>
              <span className="text-sm font-medium">{action.title}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="u-display-l text-text-main">Dashboard</h1>
        <p className="u-paragraph-m text-text-faded">Welcome back! Here's what's happening with your business today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value={`$${dashboardData.stats.totalRevenue.toLocaleString()}`}
          change="+12.5%"
          icon="💰"
        />
        <StatCard
          title="Total Users"
          value={dashboardData.stats.totalUsers.toLocaleString()}
          change="+8.2%"
          icon="👥"
        />
        <StatCard
          title="Total Orders"
          value={dashboardData.stats.totalOrders.toLocaleString()}
          change="+15.3%"
          icon="📦"
        />
        <StatCard
          title="Conversion Rate"
          value={`${dashboardData.stats.conversionRate}%`}
          change="-2.1%"
          icon="📈"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <SimpleChart data={dashboardData.chartData.revenue} title="Revenue Trend" color="primary" />
        <SimpleChart data={dashboardData.chartData.users} title="User Growth" color="cactus" />
        <SimpleChart data={dashboardData.chartData.orders} title="Order Volume" color="fig" />
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <ActivityTimeline />
        </div>
        <div>
          <QuickActions />
        </div>
      </div>
    </div>
  );
}
