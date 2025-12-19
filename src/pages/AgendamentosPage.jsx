// src/pages/AgendamentosPage.jsx
import React, { useState, useEffect } from 'react';
import { Modal, Form, Select, Button, message, Tag, Space, DatePicker, ConfigProvider, List, Empty, notification } from 'antd'; 
import { KeyOutlined, ClockCircleOutlined, CalendarOutlined, WhatsAppOutlined } from '@ant-design/icons'; 
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br'; 
import ptBR from 'antd/locale/pt_BR'; 
import { SalaDAO, AgendamentoDAO, EquipesDAO } from '../daos/DAOFactory';
import CrudTable from '../components/CrudTable';

const { Option } = Select;

const AgendamentosPage = () => {
  const [agendamentos, setAgendamentos] = useState([]);
  const [salas, setSalas] = useState([]);
  const [Equipes, setEquipes] = useState([]); 
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form] = Form.useForm();

  const [isAgendaModalOpen, setIsAgendaModalOpen] = useState(false);
  const [reservasDaSala, setReservasDaSala] = useState([]);
  const [salaSelecionada, setSalaSelecionada] = useState(null);

  const DURACAO_JOGO_MINUTOS = 60; 

  // --- ROBÔ DE LIMPEZA ---
  const verificarExpirados = async (lista) => {
      const agora = dayjs();
      let mudou = false;
      for (const ag of lista) {
          const fim = dayjs(ag.dataAgendada).add(1, 'hour');
          if (fim.isBefore(agora) && ag.status !== 'Cancelado') {
              await AgendamentoDAO.update(ag.id || ag._id, { ...ag, status: 'Cancelado' });
              mudou = true;
          }
      }
      return mudou;
  };

  const loadData = async () => {
    setLoading(true);
    try {
        let [a, s, c] = await Promise.all([
            AgendamentoDAO.getAll(), 
            SalaDAO.getAll(), 
            EquipesDAO.getAll()
        ]);

        const precisouLimpar = await verificarExpirados(a || []);
        if (precisouLimpar) {
            a = await AgendamentoDAO.getAll(); 
            message.warning("Reservas antigas expiradas foram canceladas automaticamente.");
        }

        setAgendamentos(a || []); 
        setSalas(s || []); 
        setEquipes(c || []);
    } catch (error) {
        console.error(error);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => { 
    dayjs.locale('pt-br'); 
    loadData(); 
  }, []);

  const verificarConflito = (salaId, dataInicioObj, ignoreId = null) => {
    if (!dataInicioObj) return false;
    const novoInicio = new Date(dataInicioObj).getTime();
    const novoFim = novoInicio + (DURACAO_JOGO_MINUTOS * 60 * 1000); 

    return agendamentos.some((agendamento) => {
        if (agendamento.status === 'Cancelado') return false; 

        const currentId = agendamento._id || agendamento.id;
        if (ignoreId && String(currentId) === String(ignoreId)) return false;

        const currentSalaId = agendamento.salaId?._id || agendamento.salaId;
        if (String(currentSalaId) !== String(salaId)) return false;

        const agInicio = new Date(agendamento.dataAgendada).getTime();
        const agFim = agInicio + (DURACAO_JOGO_MINUTOS * 60 * 1000);

        return (novoInicio < agFim && novoFim > agInicio);
    });
  };

  const handleSave = async (values) => {
    const agora = dayjs();
    const dataSelecionada = dayjs(values.dataAgendada);

    // 1. BLOQUEIO DE DATA PASSADA
    // Se a data selecionada for antes de "agora", erro.
    if (dataSelecionada.isBefore(agora)) {
        message.error("Erro: Não é permitido agendar em datas ou horários passados!");
        return;
    }

    // 2. BLOQUEIO DE HORÁRIO (13h às 23h)
    const hora = dataSelecionada.hour();
    if (hora < 13) {
        message.error("O estabelecimento está fechado! Horário de funcionamento: 13h às 23h.");
        return;
    }

    if (!values.salaId || !values.EquipeId || !values.dataAgendada) {
        message.error("Preencha todos os campos!");
        return;
    }

    const sala = salas.find(s => String(s._id || s.id) === String(values.salaId));
    const equipeSelecionada = Equipes.find(c => String(c._id || c.id) === String(values.EquipeId)); 

    // Validação de Capacidade
    if (sala && equipeSelecionada && equipeSelecionada.participantes > sala.capacidade) {
      message.error(`Capacidade excedida! A sala suporta apenas ${sala.capacidade} pessoas.`);
      return;
    }

    // Validação de Conflito
    const temConflito = verificarConflito(values.salaId, values.dataAgendada.toDate(), editingId);
    if (temConflito) {
        message.error("CONFLITO! Sala já ocupada neste horário.");
        return; 
    }

    setLoading(true);
    try {
        const dados = {
            ...values,
            dataAgendada: values.dataAgendada.toISOString(),
            status: 'Agendado'
        };

        if (editingId) {
            await AgendamentoDAO.update(editingId, dados);
            message.success('Atualizado!');
        } else {
            await AgendamentoDAO.create(dados);
            
            // Simulação de Envio de Mensagem
            notification.success({
                message: 'Reserva Confirmada',
                description: `Mensagens de confirmação enviadas para ${equipeSelecionada.email} e WhatsApp (${equipeSelecionada.telefone}).`,
                icon: <WhatsAppOutlined style={{ color: '#25D366' }} />,
                duration: 5
            });
        }
        
        setIsModalOpen(false);
        setEditingId(null);
        form.resetFields();
        loadData();
    } catch (error) {
        message.error("Erro ao salvar.");
    } finally {
        setLoading(false);
    }
  };

  // --- FUNÇÕES VISUAIS DE BLOQUEIO NO CALENDÁRIO ---
  
  // 1. Bloqueia dias anteriores a hoje
  const disabledDate = (current) => {
    return current && current < dayjs().startOf('day');
  };

  // 2. Bloqueia horas fora do expediente (00h-12h)
  const disabledTime = () => {
    // Cria um array de 0 a 12 para desabilitar
    const horasFechadas = [];
    for (let i = 0; i < 13; i++) {
        horasFechadas.push(i);
    }
    
    return {
      disabledHours: () => horasFechadas
    };
  };

  const abrirAgendaSala = (salaId) => {
    if (!salaId) return;
    const sala = salas.find(s => String(s.id || s._id) === String(salaId));
    setSalaSelecionada(sala);
    const reservas = agendamentos.filter(a => String(a.salaId?._id || a.salaId) === String(salaId) && a.status !== 'Cancelado');
    
    const formatadas = reservas.map(r => {
        const inicio = dayjs(r.dataAgendada);
        const fim = inicio.add(DURACAO_JOGO_MINUTOS, 'minute');
        const equipe = Equipes.find(e => String(e.id || e._id) === String(r.EquipeId?._id || r.EquipeId));
        return {
            ...r,
            inicioStr: inicio.format('HH:mm'),
            fimStr: fim.format('HH:mm'),
            dataStr: inicio.format('DD/MM/YYYY'),
            equipeNome: equipe ? equipe.nomeEquipe : '---'
        };
    });
    formatadas.sort((a, b) => new Date(a.dataAgendada) - new Date(b.dataAgendada));
    setReservasDaSala(formatadas);
    setIsAgendaModalOpen(true);
  };

  const handleEdit = (record) => {
    setEditingId(record._id || record.id);
    form.setFieldsValue({
        ...record,
        salaId: record.salaId?._id || record.salaId,
        EquipeId: record.EquipeId?._id || record.EquipeId,
        dataAgendada: record.dataAgendada ? dayjs(record.dataAgendada) : null
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => { 
      await AgendamentoDAO.delete(id); loadData(); 
  };

  const columns = [
    { title: 'Sala', dataIndex: 'salaId', key: 'salaId', render: (d) => {
        const s = salas.find(x => String(x._id || x.id) === String(d._id || d || d.id));
        // AQUI MANTEMOS O NOME SUBLINHADO
        return s ? <span onClick={() => abrirAgendaSala(s.id || s._id)} style={{cursor:'pointer', color:'#d3adf7', textDecoration: 'underline'}}>{s.nome}</span> : '-';
    }},
    { title: 'Equipe', dataIndex: 'EquipeId', key: 'EquipeId', render: (d) => {
        const e = Equipes.find(x => String(x._id || x.id) === String(d._id || d || d.id));
        return e ? <Tag color="purple">{e.nomeEquipe}</Tag> : '-';
    }},
    { title: 'Horário', dataIndex: 'dataAgendada', key: 'dataAgendada', render: d => dayjs(d).format('DD/MM HH:mm') },
    { title: 'Status', dataIndex: 'status', key: 'status', render: s => <Tag color={s === 'Cancelado' ? 'red' : 'blue'}>{s || 'Agendado'}</Tag> }
  ];

  return (
    <ConfigProvider locale={ptBR}>
      <CrudTable title="Reservas" icon={CalendarOutlined} data={agendamentos} columns={columns} loading={loading} onAddNew={() => { setEditingId(null); form.resetFields(); setIsModalOpen(true); }} onEdit={handleEdit} onDelete={handleDelete} />
      
      <Modal title={editingId ? "Editar" : "Novo"} open={isModalOpen} onCancel={() => setIsModalOpen(false)} footer={null}>
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item name="salaId" label="Sala" rules={[{ required: true }]}><Select>{salas.map(s => <Option key={s.id || s._id} value={s.id || s._id}>{s.nome}</Option>)}</Select></Form.Item>
          <Form.Item name="EquipeId" label="Equipe" rules={[{ required: true }]}><Select>{Equipes.map(e => <Option key={e.id || e._id} value={e.id || e._id}>{e.nomeEquipe}</Option>)}</Select></Form.Item>
          
          <Form.Item name="dataAgendada" label="Data e Hora" rules={[{ required: true }]}>
            <DatePicker 
                showTime={{ format: 'HH:mm' }} 
                format="DD/MM/YYYY HH:mm" 
                placeholder="Selecione (13h-23h)" 
                style={{ width: '100%' }} 
                size="large" 
                // APLICANDO AS REGRAS DE BLOQUEIO AQUI
                disabledDate={disabledDate} 
                disabledTime={disabledTime}
            />
          </Form.Item>
          
          <Button type="primary" htmlType="submit" block>Salvar</Button>
        </Form>
      </Modal>

      <Modal title="Agenda" open={isAgendaModalOpen} onCancel={() => setIsAgendaModalOpen(false)} footer={null}>
        <List dataSource={reservasDaSala} renderItem={item => <List.Item><Tag color="red">{item.inicioStr}-{item.fimStr}</Tag> {item.equipeNome}</List.Item>} />
      </Modal>
    </ConfigProvider>
  );
};

export default AgendamentosPage;