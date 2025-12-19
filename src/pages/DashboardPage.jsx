// src/pages/DashboardPage.jsx
import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, List, Typography, Button, Progress, Modal, Divider, message } from 'antd';
import { 
    RocketOutlined, 
    CrownOutlined, 
    TeamOutlined, 
    CalendarOutlined, 
    ReloadOutlined,
    DollarOutlined,
    PieChartOutlined,
    RiseOutlined,
    UsergroupAddOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
import relativeTime from 'dayjs/plugin/relativeTime'; 
import { AgendamentoDAO, SalaDAO, EquipesDAO } from '../daos/DAOFactory';

dayjs.extend(relativeTime);
dayjs.locale('pt-br');

const { Title, Text } = Typography;

const DashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [isGraphModalOpen, setIsGraphModalOpen] = useState(false);

  const [stats, setStats] = useState({ 
      totalReservas: 0, 
      salaPopular: '-', 
      equipesAtivas: 0,
      totalParticipantes: 0,
      ultimasAtividades: [],
      faturamentoMes: 0,
      taxaOcupacao: 0,
      ticketMedio: 0,
      capacidadeTotalHoras: 0,
      horasOcupadas: 0
  });

  // --- ROBÔ DE LIMPEZA (Garante que antigos virem Cancelado) ---
  const verificarCancelamentosAutomaticos = async (listaAgendamentos) => {
      const agora = dayjs();
      let alteracoes = 0;

      const atualizacoes = listaAgendamentos.map(async (agendamento) => {
          const fimDoJogo = dayjs(agendamento.dataAgendada).add(1, 'hour'); 
          
          if (fimDoJogo.isBefore(agora) && agendamento.status !== 'Cancelado') {
              alteracoes++;
              await AgendamentoDAO.update(agendamento.id || agendamento._id, {
                  ...agendamento,
                  status: 'Cancelado' 
              });
          }
      });

      await Promise.all(atualizacoes);
      
      if (alteracoes > 0) {
          message.warning({
              content: `${alteracoes} reservas antigas foram canceladas e removidas das métricas.`,
              duration: 5,
          });
          return true; 
      }
      return false;
  };

  const carregarDados = async () => {
    setLoading(true);
    try {
      let [agendamentos, salas, equipes] = await Promise.all([
          AgendamentoDAO.getAll(), 
          SalaDAO.getAll(), 
          EquipesDAO.getAll()
      ]);

      const houveMudanca = await verificarCancelamentosAutomaticos(agendamentos || []);
      
      if (houveMudanca) {
          agendamentos = await AgendamentoDAO.getAll();
      }

      const listaAgendamentos = agendamentos || [];
      const listaSalas = salas || [];
      const listaEquipes = equipes || [];

      // --- FILTRO PRINCIPAL: Ignora Cancelados ---
      const reservasValidas = listaAgendamentos.filter(a => a.status !== 'Cancelado');

      // 1. Sala Popular
      const contagemSalas = {};
      reservasValidas.forEach(a => { 
          if (a.salaId) {
             const sId = typeof a.salaId === 'object' ? (a.salaId._id || a.salaId.id) : a.salaId;
             contagemSalas[sId] = (contagemSalas[sId] || 0) + 1; 
          }
      });
      let salaMaisPopularId = null;
      let maxReservas = 0;
      for (const [id, count] of Object.entries(contagemSalas)) {
        if (count > maxReservas) { maxReservas = count; salaMaisPopularId = id; }
      }
      const salaPopularObj = listaSalas.find(s => String(s.id || s._id) === String(salaMaisPopularId));

      // 2. Últimas Atividades (Visual - mostra tudo para histórico)
      const ultimos = [...listaAgendamentos]
        .sort((a, b) => new Date(b.createdAt || b.dataAgendada) - new Date(a.createdAt || a.dataAgendada))
        .slice(0, 4)
        .map(a => {
            const sId = typeof a.salaId === 'object' ? (a.salaId._id || a.salaId.id) : a.salaId;
            const eId = typeof a.EquipeId === 'object' ? (a.EquipeId._id || a.EquipeId.id) : a.EquipeId;
            const s = listaSalas.find(item => String(item.id || item._id) === String(sId));
            const e = listaEquipes.find(item => String(item.id || item._id) === String(eId));
            return {
                id: a.id || a._id,
                sala: s ? s.nome : 'Sala Removida',
                equipe: e ? (e.nomeEquipe || e.nome) : 'Equipe Removida',
                data: a.dataAgendada,
                status: a.status || 'Agendado'
            };
        });

      // 3. Faturamento (Só válidas)
      const mesAtual = dayjs().month(); 
      const reservasMes = reservasValidas.filter(a => a.dataAgendada && dayjs(a.dataAgendada).month() === mesAtual);
      let faturamentoTotal = 0;
      reservasMes.forEach(reserva => {
          const sId = typeof reserva.salaId === 'object' ? (reserva.salaId._id || reserva.salaId.id) : reserva.salaId;
          const s = listaSalas.find(item => String(item.id || item._id) === String(sId));
          const eId = typeof reserva.EquipeId === 'object' ? (reserva.EquipeId._id || reserva.EquipeId.id) : reserva.EquipeId;
          const e = listaEquipes.find(item => String(item.id || item._id) === String(eId));

          if (s) {
              const qtdPessoas = e ? (e.participantes || 0) : 0;
              const valorNormal = parseFloat(s.valor || 0);
              const valorPromo = parseFloat(s.valorPromo || valorNormal);
              const precoAplicado = (qtdPessoas >= 8) ? valorPromo : valorNormal;
              faturamentoTotal += precoAplicado;
          }
      });

      // 4. Ocupação (Só válidas)
      const horasFuncionamentoDia = 10; 
      const diasNoMes = 30;
      const numSalas = listaSalas.length > 0 ? listaSalas.length : 1;
      const capacidadeTotalHoras = diasNoMes * horasFuncionamentoDia * numSalas;
      const horasOcupadas = reservasMes.length;
      let taxaOcupacaoCalc = (horasOcupadas / capacidadeTotalHoras) * 100;
      if (isNaN(taxaOcupacaoCalc) || !isFinite(taxaOcupacaoCalc)) taxaOcupacaoCalc = 0;
      let ticketMedioCalc = reservasMes.length > 0 ? (faturamentoTotal / reservasMes.length) : 0;

      // --- 5. CORREÇÃO NA BASE DE CLIENTES ---
      // Lógica: Pegar apenas equipes que têm reservas ATIVAS (não canceladas)
      const idsEquipesAtivas = new Set();
      reservasValidas.forEach(r => {
          const eqId = r.EquipeId?._id || r.EquipeId;
          if (eqId) idsEquipesAtivas.add(String(eqId));
      });

      // Filtra a lista de equipes para manter apenas as que têm reserva válida
      const equipesComReservaAtiva = listaEquipes.filter(e => idsEquipesAtivas.has(String(e.id || e._id)));

      // Soma apenas participantes dessas equipes ativas
      const totalPessoas = equipesComReservaAtiva.reduce((acc, equipe) => acc + (Number(equipe.participantes) || 0), 0);

      setStats({
        totalReservas: reservasValidas.length,
        salaPopular: salaPopularObj ? salaPopularObj.nome : '-',
        equipesAtivas: equipesComReservaAtiva.length, // Agora mostra apenas equipes com reserva ativa
        totalParticipantes: totalPessoas, // Soma apenas pessoas de equipes ativas
        ultimasAtividades: ultimos,
        faturamentoMes: faturamentoTotal,
        taxaOcupacao: Math.min(taxaOcupacaoCalc, 100),
        ticketMedio: ticketMedioCalc || 0,
        capacidadeTotalHoras,
        horasOcupadas
      });

    } catch (error) {
      console.error("Erro no Dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregarDados(); }, []);

  const cardStyle = { 
      background: '#1f1f1f', 
      borderRadius: 12, 
      border: '1px solid #303030', 
      height: '100%', 
      minHeight: 160, 
      display: 'flex', 
      flexDirection: 'column',
      justifyContent: 'space-between',
      position: 'relative'
  };
  
  const iconStyle = { fontSize: '24px', padding: 8, borderRadius: '50%', marginBottom: 8 };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 10 }}>
        <div>
            <Title level={2} style={{ color: '#fff', margin: 0 }}>Dashboard</Title>
            <Text style={{ color: '#888' }}>Visão geral do Escape Room</Text>
        </div>
        <Button type="primary" icon={<ReloadOutlined />} onClick={carregarDados} loading={loading}>
            Verificar Agenda
        </Button>
      </div>

      <Row gutter={[16, 16]}>
        {/* Faturamento */}
        <Col xs={24} sm={12} lg={6}>
            <Card bordered={false} bodyStyle={cardStyle}>
                <div>
                    <Statistic 
                        title={<span style={{ color: '#aaa' }}>Faturamento (Mês)</span>} 
                        value={stats.faturamentoMes} 
                        precision={2}
                        prefix={<span style={{ color: '#4ade80', marginRight: 4 }}>R$</span>}
                        valueStyle={{ color: '#fff', fontWeight: 'bold' }} 
                    />
                    <div style={{ marginTop: 8 }}>
                        <Text type="secondary" style={{ fontSize: 12, color: '#666' }}>Ticket Médio: R$ {stats.ticketMedio.toFixed(0)}</Text>
                    </div>
                </div>
                <div style={{ position: 'absolute', top: 20, right: 20 }}>
                    <DollarOutlined style={{ ...iconStyle, background: 'rgba(74, 222, 128, 0.15)', color: '#4ade80' }} />
                </div>
            </Card>
        </Col>

        {/* Sala Popular */}
        <Col xs={24} sm={12} lg={6}>
            <Card bordered={false} bodyStyle={cardStyle}>
                <Statistic 
                    title={<span style={{ color: '#aaa' }}>Sala + Popular</span>} 
                    value={stats.salaPopular} 
                    prefix={<CrownOutlined style={{ color: '#fbbf24' }} />} 
                    valueStyle={{ color: '#fff', fontSize: '1.1rem' }} 
                />
                 <div style={{ position: 'absolute', top: 20, right: 20 }}>
                    <RiseOutlined style={{ ...iconStyle, background: 'rgba(251, 191, 36, 0.15)', color: '#fbbf24' }} />
                </div>
            </Card>
        </Col>

        {/* Taxa de Ocupação */}
        <Col xs={24} sm={12} lg={6}>
            <Card 
                bordered={false} 
                bodyStyle={{...cardStyle, cursor: 'pointer', transition: '0.3s'}}
                hoverable
                onClick={() => setIsGraphModalOpen(true)}
            >
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                        <span style={{ color: '#aaa' }}>Taxa de Ocupação</span>
                        <PieChartOutlined style={{ color: '#3b82f6' }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <Progress 
                            type="circle" 
                            percent={Math.round(stats.taxaOcupacao)} 
                            width={50} 
                            strokeColor="#3b82f6" 
                            trailColor="#333"
                            format={(percent) => <span style={{ color: '#fff', fontSize: 10 }}>{percent}%</span>}
                        />
                        <div>
                            <div style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>{stats.totalReservas}</div>
                            <div style={{ color: '#666', fontSize: 12 }}>Ativas</div>
                        </div>
                    </div>
                </div>
                <div style={{ textAlign: 'right', marginTop: 'auto', paddingTop: 10 }}>
                    <Text style={{ fontSize: 10, color: '#3b82f6' }}>Clique para ver</Text>
                </div>
            </Card>
        </Col>

        {/* Base de Clientes (CORRIGIDO) */}
        <Col xs={24} sm={12} lg={6}>
            <Card bordered={false} bodyStyle={cardStyle}>
                <div>
                    <Statistic 
                        title={<span style={{ color: '#aaa' }}>Base de Clientes</span>} 
                        value={stats.equipesAtivas} 
                        prefix={<TeamOutlined style={{ color: '#a855f7' }} />} 
                        valueStyle={{ color: '#fff' }} 
                        suffix={<span style={{ fontSize: '0.8rem', color: '#888', marginLeft: 5 }}>Equipes Ativas</span>}
                    />
                    <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <UsergroupAddOutlined style={{ color: '#d8b4fe' }} />
                        <Text style={{ color: '#d8b4fe', fontWeight: 500 }}>
                            {stats.totalParticipantes} Pessoas no total
                        </Text>
                    </div>
                </div>
                <div style={{ position: 'absolute', top: 20, right: 20 }}>
                    <RocketOutlined style={{ ...iconStyle, background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7' }} />
                </div>
            </Card>
        </Col>
      </Row>

      <div style={{ marginTop: 24 }}>
        <Title level={4} style={{ color: '#fff', marginBottom: 16 }}>Últimas Atividades</Title>
        <Card bordered={false} style={{ background: '#1f1f1f', borderRadius: 12, border: '1px solid #303030' }}>
            <List 
                loading={loading} 
                itemLayout="horizontal" 
                dataSource={stats.ultimasAtividades} 
                locale={{ emptyText: <span style={{ color: '#666' }}>Nenhuma atividade recente.</span> }}
                renderItem={(item) => (
                    <List.Item style={{ borderBottom: '1px solid #333' }}>
                        <List.Item.Meta 
                            avatar={
                                item.status === 'Cancelado' ? 
                                <div style={{ background: '#261414', width: 40, height: 40, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CalendarOutlined style={{ fontSize: 18, color: '#ff4d4f' }} /></div>
                                :
                                <div style={{ background: '#262626', width: 40, height: 40, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CalendarOutlined style={{ fontSize: 18, color: '#9333ea' }} /></div>
                            } 
                            title={
                                <span style={{ color: '#e5e5e5' }}>
                                    <span style={{ color: item.status === 'Cancelado' ? '#ff4d4f' : '#9333ea', fontWeight: 'bold' }}>
                                        {item.status === 'Cancelado' ? '[CANCELADO] ' : ''}{item.equipe}
                                    </span> reservou <span style={{ fontWeight: 'bold' }}>{item.sala}</span>
                                </span>
                            } 
                            description={<span style={{ color: '#666' }}>Para: {item.data ? dayjs(item.data).format('DD/MM/YYYY [às] HH:mm') : 'Data n/a'}</span>} 
                        />
                        <div style={{ color: '#555', fontSize: 12 }}>{item.data ? dayjs(item.data).fromNow() : ''}</div>
                    </List.Item>
                )} 
            />
        </Card>
      </div>

      <Modal
        title={<span style={{ fontSize: 20 }}><PieChartOutlined /> Detalhes de Ocupação</span>}
        open={isGraphModalOpen}
        onCancel={() => setIsGraphModalOpen(false)}
        footer={[<Button key="ok" type="primary" onClick={() => setIsGraphModalOpen(false)}>Fechar</Button>]}
        centered
      >
        <div style={{ textAlign: 'center', padding: 20 }}>
            <Progress 
                type="dashboard" 
                percent={Math.round(stats.taxaOcupacao)} 
                strokeColor={{ '0%': '#108ee9', '100%': '#87d068' }}
                size={200}
            />
            <div style={{ marginTop: 20 }}>
                <Title level={4}>Eficiência da Agenda</Title>
                <Text type="secondary">Considerando funcionamento das 13h às 23h (10h/dia)</Text>
            </div>
            <Divider />
            <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                <div>
                    <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>{stats.horasOcupadas}h</div>
                    <Text type="secondary">Horas Vendidas</Text>
                </div>
                <div>
                    <div style={{ fontSize: 24, fontWeight: 'bold', color: '#555' }}>{stats.capacidadeTotalHoras}h</div>
                    <Text type="secondary">Capacidade Total</Text>
                </div>
            </div>
        </div>
      </Modal>

    </div>
  );
};

export default DashboardPage;