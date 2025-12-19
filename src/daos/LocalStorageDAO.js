// src/daos/LocalStorageDAO.js
const generateId = () => Math.random().toString(36).substr(2, 9);

export class LocalStorageDAO {
  constructor(entityName) {
    this.entityName = entityName;
  }

  _getData() {
    const data = localStorage.getItem(this.entityName);
    return data ? JSON.parse(data) : [];
  }

  _saveData(data) {
    localStorage.setItem(this.entityName, JSON.stringify(data));
  }

  getAll() {
    return new Promise((resolve) => {
        // Simula um pequeno delay para parecer real
        setTimeout(() => resolve(this._getData()), 200);
    });
  }

  create(item) {
    return new Promise((resolve) => {
      const data = this._getData();
      const newItem = { 
        ...item, 
        id: item.id || generateId(), 
        createdAt: new Date().toISOString() 
      };
      data.push(newItem);
      this._saveData(data);
      setTimeout(() => resolve(newItem), 200);
    });
  }

  update(id, updatedItem) {
    return new Promise((resolve) => {
      const data = this._getData();
      // Procura por id (string) ou _id (caso tenha sobrado do mongo)
      const index = data.findIndex(item => String(item.id) === String(id) || String(item._id) === String(id));
      
      if (index !== -1) {
        data[index] = { ...data[index], ...updatedItem };
        this._saveData(data);
        setTimeout(() => resolve(data[index]), 200);
      } else {
        resolve(null);
      }
    });
  }

  delete(id) {
    return new Promise((resolve) => {
      const data = this._getData();
      const filteredData = data.filter(item => String(item.id) !== String(id) && String(item._id) !== String(id));
      this._saveData(filteredData);
      setTimeout(() => resolve(true), 200);
    });
  }
}