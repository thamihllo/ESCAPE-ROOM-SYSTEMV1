// src/App.jsx
import React, { useState } from 'react';
import { Layout, Menu, ConfigProvider, theme } from 'antd';
import { AppstoreOutlined, UsergroupAddOutlined, CalendarOutlined, KeyOutlined, LogoutOutlined } from '@ant-design/icons';
import ptBR from 'antd/locale/pt_BR';

import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import AgendamentosPage from './pages/AgendamentosPage';
import SalasPage from './pages/SalasPage';
import EquipesPage from './pages/EquipesPage';

const { Sider, Content } = Layout;

const App = () => {
  const [showLanding, setShowLanding] = useState(true);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [collapsed, setCollapsed] = useState(false);
  const { token: { borderRadiusLG } } = theme.useToken();

  const renderContent = () => {
    switch (currentPage) {
      case 'dashboard': return <DashboardPage />;
      case 'salas': return <SalasPage />;
      case 'equipes': return <EquipesPage />;
      case 'agendamentos': return <AgendamentosPage />;
      default: return <DashboardPage />;
    }
  };

  const menuItems = [
    { key: 'dashboard', icon: <AppstoreOutlined />, label: 'Dashboard' },
    { key: 'salas', icon: <KeyOutlined />, label: 'Salas' },
    { key: 'equipes', icon: <UsergroupAddOutlined />, label: 'Equipes' },
    { key: 'agendamentos', icon: <CalendarOutlined />, label: 'Agendamentos' },
    { type: 'divider' },
    { key: 'Voltar', icon: <LogoutOutlined />, label: 'Voltar', danger: true },
  ];

  if (showLanding) return <LandingPage onEnter={() => setShowLanding(false)} />;

  return (
    <ConfigProvider locale={ptBR} theme={{ algorithm: theme.darkAlgorithm, token: { colorPrimary: '#9333ea' } }}>
      <Layout style={{ minHeight: '100vh' }}>
        <Sider 
            collapsible 
            collapsed={collapsed} 
            onCollapse={(value) => setCollapsed(value)} 
            breakpoint="lg" 
            collapsedWidth="80" 
            width={250} 
            style={{ 
                background: '#001529', 
                borderRight: '1px solid rgba(255,255,255,0.05)', 
                zIndex: 10 
            }}
        >
          {/* --- CORREÇÃO DO LOGO AQUI (Ícone em vez de "ER") --- */}
          <div style={{ 
              height: 64, 
              margin: '0 10px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              overflow: 'hidden', 
              whiteSpace: 'nowrap', 
              color: '#fff', 
              fontWeight: 'bold', 
              fontSize: collapsed ? '1.5rem' : '1.2rem', 
              transition: 'all 0.2s', 
              letterSpacing: collapsed ? '0' : '1px' 
          }}>
            {collapsed ? <KeyOutlined style={{ color: '#9333ea' }} /> : 'ESCAPE ROOM'}
          </div>

          <Menu 
            theme="dark" 
            defaultSelectedKeys={['dashboard']} 
            mode="inline" 
            items={menuItems} 
            selectedKeys={[currentPage]} 
            onClick={(e) => { if (e.key === 'Voltar') setShowLanding(true); else setCurrentPage(e.key); }} 
          />
        </Sider>
        <Layout>
          <Content style={{ margin: '16px', overflow: 'initial' }}>
            <div style={{ padding: 24, background: '#141414', borderRadius: borderRadiusLG, minHeight: '100%', boxShadow: '0 0 20px rgba(0,0,0,0.2)', maxWidth: '100%', overflowX: 'hidden' }}>
              {renderContent()}
            </div>
          </Content>
        </Layout>
      </Layout>
      <style>{` body, #root { height: 100%; margin: 0; padding: 0; } .ant-table-wrapper { overflow-x: auto; width: 100%; } ::-webkit-scrollbar { width: 8px; height: 8px; } ::-webkit-scrollbar-track { background: #1f1f1f; } ::-webkit-scrollbar-thumb { background: #555; border-radius: 4px; } ::-webkit-scrollbar-thumb:hover { background: #777; } `}</style>
    </ConfigProvider>
  );
};
export default App;