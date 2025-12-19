// src/components/CrudTable.jsx
import React from 'react';
import { Card, Table, Button, Space } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

const styles = {
    glassCard: {
        background: '#1f1f1f',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        marginBottom: '20px'
    }
};

const CrudTable = ({ data, columns, loading, onEdit, onDelete, onAddNew, title, icon: Icon }) => {
    return (
        <Card 
            title={
                <Space className="text-purple-400">
                    {Icon && <Icon size={24} color="#a06dd6" />} 
                    <span style={{fontSize: '1.2em', color: '#d3adf7', marginLeft: 8}}>{title}</span>
                </Space>
            } 
            extra={
                <Button type="primary" size="large" icon={<PlusOutlined />} onClick={onAddNew}>
                    Novo Registro
                </Button>
            }
            style={styles.glassCard}
            bordered={false}
        >
            <Table 
                rowKey={(record) => record.id || record._id}
                columns={[
                    ...columns,
                    {
                        title: 'Ações',
                        key: 'actions',
                        align: 'center',
                        width: 120,
                        fixed: 'right',
                        render: (_, record) => (
                            <Space>
                                <Button type="text" icon={<EditOutlined style={{ color: '#1890ff' }} />} onClick={() => onEdit(record)} />
                                <Button type="text" danger icon={<DeleteOutlined />} onClick={() => onDelete(record.id || record._id)} />
                            </Space>
                        ),
                    },
                ]} 
                dataSource={data} 
                loading={loading}
                pagination={{ pageSize: 6 }}
                scroll={{ x: 800 }} 
            />
        </Card>
    );
};

export default CrudTable;