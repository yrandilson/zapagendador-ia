import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { Calendar, Users, Clock, TrendingUp, MessageSquare, Settings } from "lucide-react";
import { useLocation } from "wouter";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col items-center justify-center px-4">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <MessageSquare className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">ZapAgendador IA</h1>
            <p className="text-lg text-slate-600 mb-8">
              Automatize seus agendamentos via WhatsApp com inteligência artificial
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8 space-y-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Calendar className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-slate-900">Agendamentos Automáticos</h3>
                  <p className="text-sm text-slate-600">Receba e processe agendamentos automaticamente via WhatsApp</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Users className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-slate-900">Gestão de Clientes</h3>
                  <p className="text-sm text-slate-600">Organize e acompanhe todos os seus clientes em um único lugar</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <TrendingUp className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-slate-900">Analytics em Tempo Real</h3>
                  <p className="text-sm text-slate-600">Visualize métricas e tendências de seus agendamentos</p>
                </div>
              </div>
            </div>

            <Button
              onClick={() => window.location.href = getLoginUrl()}
              className="w-full h-12 text-base font-semibold"
            >
              Entrar com Manus
            </Button>
          </div>

          <p className="text-center text-sm text-slate-600">
            Plataforma B2B para automação de agendamentos com IA
          </p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-600 mt-2">Bem-vindo, {user?.name || "Usuário"}!</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Agendamentos Hoje</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">0</div>
              <p className="text-xs text-slate-500 mt-1">Nenhum agendamento</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Clientes Ativos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">0</div>
              <p className="text-xs text-slate-500 mt-1">Nenhum cliente</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Taxa de Conversão</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">0%</div>
              <p className="text-xs text-slate-500 mt-1">Sem dados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Mensagens Processadas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">0</div>
              <p className="text-xs text-slate-500 mt-1">Nenhuma mensagem</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar Section */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Calendário de Agendamentos</CardTitle>
              <CardDescription>Visualize seus agendamentos do mês</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96 flex items-center justify-center bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
                <div className="text-center">
                  <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-500">Calendário será exibido aqui</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate("/appointments")}
              >
                <Calendar className="w-4 h-4 mr-2" />
                Agendamentos
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate("/customers")}
              >
                <Users className="w-4 h-4 mr-2" />
                Clientes
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate("/services")}
              >
                <Clock className="w-4 h-4 mr-2" />
                Serviços
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate("/settings")}
              >
                <Settings className="w-4 h-4 mr-2" />
                Configurações
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Atividade Recente</CardTitle>
            <CardDescription>Últimas ações na plataforma</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-slate-200">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">Nenhuma atividade</p>
                    <p className="text-xs text-slate-500">Comece criando seus primeiros agendamentos</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
