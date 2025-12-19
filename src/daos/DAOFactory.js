// src/daos/DAOFactory.js
import { LocalStorageDAO } from './LocalStorageDAO';

// Configuração para usar APENAS o navegador (Sem Backend)
export const SalaDAO = new LocalStorageDAO('db_salas');
export const EquipesDAO = new LocalStorageDAO('db_equipes');
export const AgendamentoDAO = new LocalStorageDAO('db_agendamentos');