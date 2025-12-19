// src/pages/SalasPage.jsx
import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, InputNumber, Button, message, Tag, List, Empty, Select } from 'antd'; 
import { DollarOutlined, UserOutlined, TeamOutlined, CalendarOutlined } from '@ant-design/icons';
import dayjs from 'dayjs'; 
import CrudTable from '../components/CrudTable';
import { SalaDAO, AgendamentoDAO, EquipesDAO } from '../daos/DAOFactory';

const { Option } = Select; 

const SalasPage = () => {
  const [salas, setSalas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form] = Form.useForm();
  
  // Agenda Modal
  const [isAgendaModalOpen, setIsAgendaModalOpen] = useState(false);
  const [reservasDaSala, setReservasDaSala] = useState([]);
  const [salaSelecionada, setSalaSelecionada] = useState(null);

  const loadData = async () => {
    setLoading(true);
    const data = await SalaDAO.getAll();
    setSalas(data || []);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleVerAgenda = async (salaRecord) => {
    setSalaSelecionada(salaRecord);
    const [todosAgendamentos, todasEquipes] = await Promise.all([AgendamentoDAO.getAll(), EquipesDAO.getAll()]);
    
    // Filtra para mostrar APENAS reservas que NÃO estão canceladas
    const agendamentosFiltrados = todosAgendamentos.filter((reserva) => {
        const isSameSala = String(reserva.salaId?._id || reserva.salaId) === String(salaRecord.id || salaRecord._id);
        const isActive = reserva.status !== 'Cancelado'; 
        return isSameSala && isActive;
    });
    
    const dadosCompletos = agendamentosFiltrados.map(reserva => {
        const equipe = todasEquipes.find(e => String(e.id || e._id) === String(reserva.EquipeId?._id || reserva.EquipeId));
        return { ...reserva, equipeNome: equipe ? (equipe.nomeEquipe || equipe.nome) : 'Equipe Removida' };
    });
    
    dadosCompletos.sort((a, b) => new Date(a.dataAgendada) - new Date(b.dataAgendada));
    setReservasDaSala(dadosCompletos);
    setIsAgendaModalOpen(true);
  };
  
  const handleSave = async (values) => {
    setLoading(true);
    const dadosSalvos = { ...values, status: values.status || 'Disponível' };
    if (editingId) await SalaDAO.update(editingId, dadosSalvos);
    else await SalaDAO.create(dadosSalvos);
    message.success(editingId ? 'Atualizado!' : 'Criado!');
    setIsModalOpen(false); setEditingId(null); form.resetFields(); loadData(); setLoading(false);
  };

  const handleEdit = (record) => { setEditingId(record.id || record._id); form.setFieldsValue(record); setIsModalOpen(true); };
  const handleDelete = async (id) => { await SalaDAO.delete(id); loadData(); };
  
  const columns = [
    { title: 'Nome da Sala', dataIndex: 'nome', key: 'nome', render: text => <b>{text}</b> },
    { title: 'Capacidade', dataIndex: 'capacidade', key: 'capacidade', render: cap => <Tag icon={<UserOutlined />}>{cap} Pessoas</Tag> },
    { title: 'Preço (Padrão)', dataIndex: 'valor', key: 'valor', render: val => <Tag color="blue">R$ {parseFloat(val || 0).toFixed(2)}</Tag> },
    { title: 'Preço (Time Cheio)', dataIndex: 'valorPromo', key: 'valorPromo', render: val => <Tag color="green"><TeamOutlined /> R$ {parseFloat(val || 0).toFixed(2)}</Tag> },
    { title: 'Status', dataIndex: 'status', key: 'status', render: s => <Tag color={s === 'Manutenção' ? 'orange' : 'blue'}>{s}</Tag> },
    { title: 'Agenda', key: 'agenda', render: (_, record) => (<Button type="dashed" icon={<CalendarOutlined />} onClick={() => handleVerAgenda(record)}>Ver Reservas</Button>) }
  ];

  return (
    <>
      <CrudTable title="Gerenciar Salas & Preços" icon={DollarOutlined} data={salas} columns={columns} loading={loading} onEdit={handleEdit} onDelete={handleDelete} onAddNew={() => { setEditingId(null); form.resetFields(); setIsModalOpen(true); }} />
      
      <Modal title={editingId ? "Editar Sala" : "Nova Sala"} open={isModalOpen} onCancel={() => setIsModalOpen(false)} footer={null}>
        
        {/* AQUI ESTÁ A ALTERAÇÃO: Adicionei valor: 120 e valorPromo: 105 aos valores iniciais */}
        <Form 
            form={form} 
            layout="vertical" 
            onFinish={handleSave} 
            initialValues={{ 
                capacidade: 8, 
                status: 'Disponível',
                valor: 120,       // Preço Padrão Padrão
                valorPromo: 105   // Preço Promocional Padrão
            }}
        >
          
          <Form.Item name="nome" label="Nome da Sala" rules={[{ required: true }]}><Input size="large" /></Form.Item>
          
          <Form.Item 
            name="capacidade" 
            label="Capacidade Máx. (2 a 8 Pessoas)" 
            rules={[
                { required: true, message: 'Informe a capacidade da sala!' },
                { type: 'number', min: 2, message: 'O mínimo permitido são 2 pessoas.' },
                { type: 'number', max: 8, message: 'O máximo permitido são 8 pessoas.' }
            ]}
          >
            <InputNumber min={2} max={8} style={{ width: '100%' }} size="large" />
          </Form.Item>

          <div style={{ display: 'flex', gap: 16 }}>
            {/* O valor padrão virá preenchido (120) */}
            <Form.Item name="valor" label="Valor Padrão" style={{ flex: 1 }} rules={[{ required: true }]}>
                <InputNumber 
                    style={{ width: '100%' }} 
                    size="large" 
                    formatter={(value) => `R$ ${value}`} 
                    parser={(value) => value.replace(/\R\$\s?|(,*)/g, '')}
                />
            </Form.Item>
            
            {/* O valor promo virá preenchido (105) */}
            <Form.Item name="valorPromo" label="Valor Time Cheio (8+)" style={{ flex: 1 }} rules={[{ required: true }]}>
                <InputNumber 
                    style={{ width: '100%', color: 'green' }} 
                    size="large" 
                    formatter={(value) => `R$ ${value}`} 
                    parser={(value) => value.replace(/\R\$\s?|(,*)/g, '')}
                />
            </Form.Item>
          </div>
          
          <Form.Item name="status" label="Situação Atual"><Select size="large"><Option value="Disponível">Disponível</Option><Option value="Manutenção">Manutenção</Option></Select></Form.Item>
          <Button type="primary" htmlType="submit" block size="large">Salvar</Button>
        </Form>
      </Modal>

      <Modal title={`Agenda: ${salaSelecionada?.nome}`} open={isAgendaModalOpen} onCancel={() => setIsAgendaModalOpen(false)} footer={null}>
        <List 
            dataSource={reservasDaSala} 
            locale={{ emptyText: <Empty description="Nenhuma reserva ativa." /> }} 
            renderItem={(item) => (
                <List.Item>
                    <Tag color="volcano">Reservado</Tag> 
                    <b>{item.equipeNome}</b> 
                    <span style={{ marginLeft: 10 }}>{dayjs(item.dataAgendada).format('DD/MM HH:mm')}</span>
                </List.Item>
            )} 
        />
      </Modal>
    </>
  );
};
export default SalasPage;