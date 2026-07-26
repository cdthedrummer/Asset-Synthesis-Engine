import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { Layout } from '@/components/Layout';
import Board from '@/pages/Board';
import Verdicts from '@/pages/Verdicts';
import Plan from '@/pages/Plan';
import Pulse from '@/pages/Pulse';
import Advisor from '@/pages/Advisor';

const queryClient = new QueryClient();

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Board} />
        <Route path="/verdicts" component={Verdicts} />
        <Route path="/plan" component={Plan} />
        <Route path="/pulse" component={Pulse} />
        <Route path="/advisor" component={Advisor} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster theme="dark" />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;