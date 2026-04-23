import React, { useState } from 'react';
import { INITIAL_ROOMS } from './dataStore';
import './App.css';

function App() {
  const [rooms, setRooms] = useState(INITIAL_ROOMS);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [isReservaOpen, setIsReservaOpen] = useState(false);
  
  // Estado que imita todos los campos funcionales de la imagen de referencia
  const [formData, setFormData] = useState({
    apellido: '', nombre: '', dni: '', telefono: '', email: '',
    checkIn: '2026-04-20', checkOut: '2026-04-21', noches: 1,
    adultos: 1, menores: 0, regimen: 'RO',
    estado: 'Tentativa', tarifaManual: 0, 
    montoPagado: 0, metodoPago: 'Efectivo'
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      // Lógica real: Si cambian las fechas, se deberían calcular las noches (simplificado aquí)
      return newData;
    });
  };

  const guardarReservaReal = (e) => {
    e.preventDefault();
    if (!formData.apellido || !formData.nombre) return alert("Faltan datos del huésped");

    const resID = `RES-${Math.floor(100000 + Math.random() * 900000)}`;
    const total = parseFloat(formData.tarifaManual) || selectedRoom.rate;
    const pago = parseFloat(formData.montoPagado) || 0;
    const saldo = total - pago;

    const updatedRooms = rooms.map(r => 
      r.id === selectedRoom.id 
        ? { 
            ...r, 
            status: 'occupied', 
            guest: { 
              ...formData, 
              reservaID: resID, 
              saldo: saldo,
              estadoPago: saldo <= 0 ? 'PAGADO' : (pago > 0 ? 'SEÑA' : 'PENDIENTE')
            } 
          } 
        : r
    );

    setRooms(updatedRooms);
    setIsReservaOpen(false);
    alert(`Reserva ${resID} guardada. Saldo pendiente: $${saldo}`);
  };

  return (
    <div className="pms-container">
      <header className="pms-header">
        <h1>Hotel Obelisco - Gestión Real</h1>
      </header>

      {/* Rack interactivo */}
      <main className="pms-grid">
        {rooms.map(room => (
          <div key={room.id} className={`room-tile ${room.status}`} 
               onClick={() => { 
                 setSelectedRoom(room); 
                 setFormData(f => ({...f, tarifaManual: room.rate})); 
                 setIsReservaOpen(true); 
               }}>
            <div className="room-number">{room.id}</div>
            <div className="room-guest">{room.guest ? room.guest.apellido : 'LIBRE'}</div>
            {room.guest && <div className="badge-pago">{room.guest.estadoPago}</div>}
          </div>
        ))}
      </main>

      {/* Ventana de Reserva funcional */}
      {isReservaOpen && selectedRoom && (
        <div className="modal-overlay">
          <div className="reserva-window-real">
            <form onSubmit={guardarReservaReal}>
              <div className="reserva-section">
                <h3>Huésped y Contacto</h3>
                <div className="row">
                  <input name="apellido" placeholder="Apellido" onChange={handleInputChange} required />
                  <input name="nombre" placeholder="Nombre" onChange={handleInputChange} required />
                  <input name="dni" placeholder="Documento" onChange={handleInputChange} />
                </div>
                <div className="row">
                  <input name="telefono" placeholder="Teléfono" onChange={handleInputChange} />
                  <input name="email" placeholder="E-mail" onChange={handleInputChange} />
                </div>
              </div>

              <div className="reserva-section">
                <h3>Estadía y Ocupación</h3>
                <div className="row">
                  <label>Entrada: <input type="date" name="checkIn" value={formData.checkIn} onChange={handleInputChange} /></label>
                  <label>Salida: <input type="date" name="checkOut" value={formData.checkOut} onChange={handleInputChange} /></label>
                </div>
                <div className="row">
                  <label>Adultos: <input type="number" name="adultos" defaultValue="1" onChange={handleInputChange} /></label>
                  <label>Menores: <input type="number" name="menores" defaultValue="0" onChange={handleInputChange} /></label>
                  <select name="regimen" onChange={handleInputChange}>
                    <option value="RO">Solo Habitación</option>
                    <option value="BB">Con Desayuno</option>
                  </select>
                </div>
              </div>

              <div className="reserva-section">
                <h3>Tarifas y Pagos</h3>
                <div className="row">
                  <label>Tarifa x Noche: <input type="number" name="tarifaManual" value={formData.tarifaManual} onChange={handleInputChange} /></label>
                  <label>Monto Entrega: <input type="number" name="montoPagado" placeholder="Seña" onChange={handleInputChange} /></label>
                  <select name="metodoPago" onChange={handleInputChange}>
                    <option>Efectivo</option>
                    <option>Transferencia</option>
                    <option>Tarjeta</option>
                  </select>
                </div>
              </div>

              <div className="reserva-section">
                <h3>Estado de Reserva</h3>
                <div className="row">
                  <label><input type="radio" name="estado" value="Tentativa" defaultChecked onChange={handleInputChange} /> Tentativa</label>
                  <label><input type="radio" name="estado" value="Garantizada" onChange={handleInputChange} /> Garantizada</label>
                </div>
              </div>

              <footer className="reserva-actions">
                <button type="submit" className="btn-save">💾 Guardar Cambios</button>
                <button type="button" className="btn-cancel" onClick={() => setIsReservaOpen(false)}>❌ Cancelar</button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
