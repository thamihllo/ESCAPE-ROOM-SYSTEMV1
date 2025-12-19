import React from 'react';
import { Button, Typography, Space } from 'antd';
import { RocketOutlined, ArrowRightOutlined, KeyOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const LandingPage = ({ onEnter }) => {
 
  return (
    <div style={{
      position: 'relative',
      height: '100vh',
      width: '100vw',
      background: '#050505',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Inter', sans-serif" 
    }}>
      
      {/* --- CAMADA DE FUNDO (ANIMAÇÕES) --- */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, width: '100%', height: '100%',
        background: 'radial-gradient(circle at 50% 50%, #1a103c 0%, #000000 100%)',
        zIndex: 1
      }} />
      
      {/* Blob Roxo (Luz 1) */}
      <div style={{
        position: 'absolute', top: '10%', left: '20%',
        width: '40vw', height: '40vw',
        background: '#7e22ce',
        filter: 'blur(120px)', opacity: 0.25, borderRadius: '50%',
        animation: 'float 12s infinite ease-in-out',
        zIndex: 2
      }} />
      
      {/* Blob Azul (Luz 2) */}
      <div style={{
        position: 'absolute', bottom: '10%', right: '10%',
        width: '35vw', height: '35vw',
        background: '#3b82f6',
        filter: 'blur(120px)', opacity: 0.2, borderRadius: '50%',
        animation: 'float 10s infinite ease-in-out reverse',
        zIndex: 2
      }} />

      {/* --- CONTEÚDO PRINCIPAL --- */}
      <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', padding: '0 24px', maxWidth: 800 }}>
        
        {/* Ícone de Destaque */}
        <div className="icon-glow" style={{
            display: 'inline-flex', justifyContent: 'center', alignItems: 'center',
            width: 80, height: 80,
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '24px',
            border: '1px solid rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
            marginBottom: 32,
            boxShadow: '0 0 40px rgba(126, 34, 206, 0.4)'
        }}>
            <KeyOutlined style={{ fontSize: 36, color: '#d8b4fe' }} />
        </div>

        {/* Títulos */}
        <Title style={{ 
          fontSize: 'clamp(3rem, 6vw, 5rem)', // Responsivo
          margin: 0, 
          color: '#fff',
          letterSpacing: '-2px',
          lineHeight: 1.1,
          textShadow: '0 0 50px rgba(168, 85, 247, 0.5)'
        }}>
          ESCAPE ROOM
        </Title>
        
        <Title level={2} style={{ 
          fontSize: 'clamp(1rem, 2vw, 1.5rem)', 
          margin: '16px 0 40px 0', 
          color: '#a8a29e', 
          fontWeight: 300,
          letterSpacing: '6px',
          textTransform: 'uppercase'
        }}>
          Manager System v2.0
        </Title>

        {/* Botão de Ação */}
        <Space size="large">
            <Button 
                type="primary" 
                size="large" 
                shape="round" 
                onClick={onEnter} // Conecte sua navegação aqui
                style={{
                    height: 64,
                    padding: '0 48px',
                    fontSize: 18,
                    fontWeight: 600,
                    background: 'linear-gradient(90deg, #9333ea 0%, #4f46e5 100%)',
                    border: 'none',
                    boxShadow: '0 10px 40px -10px rgba(147, 51, 234, 0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12
                }}
                className="hover-effect"
            >
                ENTRAR NO SISTEMA <ArrowRightOutlined />
            </Button>
        </Space>

        <div style={{ marginTop: 60, opacity: 0.5 }}>
             <Text style={{ color: '#666', fontSize: 12, letterSpacing: 1 }}>
               DESENVOLVIDO POR: THAMIRES FERNANDES BORGES
             </Text>
        </div>
      </div>

      {/* --- ESTILOS CSS INLINE PARA ANIMAÇÃO --- */}
      <style>{`
        @keyframes float {
            0% { transform: translate(0, 0); }
            50% { transform: translate(-30px, 30px); }
            100% { transform: translate(0, 0); }
        }
        
        .hover-effect {
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) !important;
        }
        .hover-effect:hover {
            transform: scale(1.05) translateY(-2px) !important;
            box-shadow: 0 20px 50px -10px rgba(147, 51, 234, 0.9) !important;
            filter: brightness(1.1);
        }
        
        /* Ajuste de seleção de texto para combinar com o tema */
        ::selection {
            background: #9333ea;
            color: #fff;
        }
      `}</style>
    </div>
  );
};

export default LandingPage;