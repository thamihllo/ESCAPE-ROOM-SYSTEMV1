// src/pages/EquipesPage.jsx
import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, InputNumber, Button, message, Tag, Row, Col, Space } from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined, RocketOutlined } from '@ant-design/icons';
import { Users } from 'lucide-react';
import { EquipesDAO } from '../daos/DAOFactory';
import CrudTable from '../components/CrudTable';

const EquipesPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form] = Form.useForm();

  const loadData = async () => {
    setLoading(true);
    const data = await EquipesDAO.getAll();
    setItems(data || []);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleSave = async (values) => {
    setLoading(true);
    if (editingItem) await EquipesDAO.update(editingItem.id || editingItem._id, values);
    else await EquipesDAO.create(values);
    message.success('Salvo!');
    setIsModalOpen(false); loadData();
  };

  const handleDelete = async (id) => Modal.confirm({ title: 'Excluir?', okType: 'danger', onOk: async () => { await EquipesDAO.delete(id); loadData(); } });
  const openModal = (item) => { setEditingItem(item); form.setFieldsValue(item || {}); setIsModalOpen(true); };
  const handleAddNew = () => { openModal(null); form.resetFields(); };

  const columns = [
    { title: 'Equipe', dataIndex: 'nomeEquipe', key: 'nomeEquipe', render: t => <Tag color="geekblue">{t || 'Individual'}</Tag> },
    { title: 'Líder', dataIndex: 'nome', key: 'nome', render: t => <b>{t}</b> },
    { title: 'Contato', dataIndex: 'email', key: 'email', responsive: ['md'] },
    { title: 'Partic.', dataIndex: 'participantes', key: 'participantes', render: v => <Space><UserOutlined /> {v}</Space> },
  ];

  return (
    <>
      <CrudTable title="Equipes" icon={Users} data={items} columns={columns} loading={loading} onAddNew={handleAddNew} onEdit={openModal} onDelete={handleDelete} />
      <Modal title={editingItem ? "Editar Equipe" : "Nova Equipe"} open={isModalOpen} onCancel={() => setIsModalOpen(false)} footer={null}>
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item name="nomeEquipe" label="Nome da Equipe"><Input prefix={<RocketOutlined />} placeholder="Ex: Os Fugitivos" size="large" /></Form.Item>
          <Form.Item name="nome" label="Nome do Responsável" rules={[{ required: true }]}><Input prefix={<UserOutlined />} size="large" /></Form.Item>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}><Input prefix={<MailOutlined />} /></Form.Item></Col>
            <Col span={12}><Form.Item name="telefone" label="Telefone" rules={[{ required: true }]}><Input maxLength={11} prefix={<PhoneOutlined />} /></Form.Item></Col>
          </Row>
          
          {/* AQUI ESTÁ A CORREÇÃO: Limite de 8 Participantes */}
          <Form.Item 
            name="participantes" 
            label="Total Participantes (Máx: 8)" 
            rules={[
                { required: true, message: 'Informe a quantidade!' },
                { type: 'number', max: 8, message: 'O máximo permitido são 8 participantes!' },
                { type: 'number', min: 1, message: 'Mínimo de 1 participante.' }
            ]}
          >
            <InputNumber min={1} max={8} style={{ width: '100%' }} size="large" />
          </Form.Item>

          <Button type="primary" htmlType="submit" block size="large">Salvar</Button>
        </Form>
      </Modal>
    </>
  );
};
export default EquipesPage;