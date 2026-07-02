import React, { useState, useEffect } from 'react';
import { 
  Map as MapIcon, Package, History, Calendar, BarChart3, User, 
  LogOut, Plus, Trash2, CheckCircle2, Clock, AlertTriangle, 
  Lock, Building, Mail, ChevronRight, Check, Upload, Info,
  Bike, Truck, Download, Zap, Filter, ShieldAlert, ShieldCheck,
  ArrowLeft, ArrowRight, LayoutDashboard, TrendingUp, DollarSign,
  Receipt, Calculator, CreditCard, Printer, FileText, Smartphone,
  Navigation, CheckCircle, Phone, PlayCircle, Star, Camera, PenTool,
  MessageCircle, Wallet, Store, ShoppingCart, Globe, Headset
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'id_' + Math.random().toString(36).substring(2, 15);
};

export default function App() {
  const [showLanding, setShowLanding] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(true);
  const [showPDF, setShowPDF] = useState(false);
  const [showDriverView, setShowDriverView] = useState(false);
  
  const [selectedPlanToRegister, setSelectedPlanToRegister] = useState('pyme');
  const [legalModal, setLegalModal] = useState(null);
  const [modalEntrega, setModalEntrega] = useState(null);
  const [formPOD, setFormPOD] = useState({ metodoPago: 'efectivo', firma: '', fotoCapturada: false });

  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('pos');
  
  const [entregas, setEntregas] = useState([]);
  const [inventario, setInventario] = useState([
    { id: generateUUID(), nombre: 'Cemento Progreso 4000', cantidad: 50, precio: 75.00, minimo: 10 },
    { id: generateUUID(), nombre: 'Alambre de Amarre', cantidad: 20, precio: 8.50, minimo: 10 },
    { id: generateUUID(), nombre: 'Tubo PVC 1/2"', cantidad: 120, precio: 22.00, minimo: 50 }
  ]);
  const [eventos, setEventos] = useState([]);
  const [gastos, setGastos] = useState([]);
  const [toasts, setToasts] = useState([]);

  const [clientesAdmin, setClientesAdmin] = useState([
    { id: generateUUID(), company: 'Ferretería El Progreso', email: 'contacto@elprogreso.com', telefono: '44558899', plan: 'pyme', diasRestantes: 25, estado: 'activo', fechaRegistro: '2026-06-05' },
    { id: generateUUID(), company: 'Distribuidora del Valle', email: 'gerencia@valledist.com', telefono: '55661122', plan: 'corporativo', diasRestantes: 12, estado: 'activo', fechaRegistro: '2026-06-18' },
    { id: generateUUID(), company: 'Materiales San Juan', email: 'ventas@sanjuan.com', telefono: '33229900', plan: 'emprendedor', diasRestantes: 2, estado: 'pendiente', fechaRegistro: '2026-06-28' }
  ]);

  const [notasAdmin, setNotasAdmin] = useState([
    { id: generateUUID(), nota: 'Llamar a Materiales San Juan para concretar pago.' }
  ]);
  const [nuevaNota, setNuevaNota] = useState('');

  const [isForgotMode, setIsForgotMode] = useState(false);
  const [filtroHistorial, setFiltroHistorial] = useState('todos');
  const [filtroFinanzas, setFiltroFinanzas] = useState('todos');

  const [formAuth, setFormAuth] = useState({ email: '', password: '', company: '', telefono: '', remember: false, acceptTerms: false });
  const [formRuta, setFormRuta] = useState({ cliente: '', telefono: '', direccion: '', productoId: '', customPedido: '', cantidad: 1, total: '', tipoEnvio: 'propio', responsable: '' });
  const [formStock, setFormStock] = useState({ nombre: '', cantidad: '', precio: '', minimo: '' });
  const [formEvento, setFormEvento] = useState({ titulo: '', fecha: '', detalles: '' });
  const [formPerfil, setFormPerfil] = useState({ company: '', email: '', newPassword: '', confirmPassword: '' });
  const [formGasto, setFormGasto] = useState({ descripcion: '', monto: '' });
  const [formPOS, setFormPOS] = useState({ cliente: 'Cliente Mostrador', productoId: '', customPedido: '', cantidad: 1, total: '', metodoPago: 'efectivo' });

  useEffect(() => {
    const sessionToken = localStorage.getItem('rutaSync_session_token');
    if (sessionToken) {
      try {
        const decodedString = atob(sessionToken);
        const parsedUser = JSON.parse(decodedString);
        if (parsedUser && parsedUser.email) {
          setUser(parsedUser);
          setIsLoggedIn(true);
          setShowLanding(false);
        }
      } catch (e) { 
        console.error("Token inválido.", e);
        localStorage.removeItem('rutaSync_session_token');
      }
    }
  }, []);

  const addToast = (message, type = 'success') => {
    const id = generateUUID();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  const handleNavigateToAuth = (isRegister, plan = 'pyme') => { 
    setSelectedPlanToRegister(plan);
    setIsRegisterMode(isRegister); 
    setIsForgotMode(false);
    setShowLanding(false); 
  };

  const handleAuth = (e) => {
    e.preventDefault();
    const emailSanitizado = formAuth.email.trim().toLowerCase();
    
    if (isRegisterMode) {
      if (!formAuth.acceptTerms) { addToast('Debe aceptar los términos legales.', 'error'); return; }
      if (!emailSanitizado.includes('@') || !emailSanitizado.includes('.')) { addToast('Formato de correo inválido.', 'error'); return; }
      if (emailSanitizado === 'admin@rutasync.com' || clientesAdmin.some(c => c.email === emailSanitizado)) {
        addToast('Este correo ya está registrado.', 'error'); return;
      }
      const pwd = formAuth.password;
      if (pwd.length < 8 || !/[A-Za-z]/.test(pwd) || !/[0-9]/.test(pwd) || !/[^A-Za-z0-9]/.test(pwd)) {
        addToast('Clave débil. Use letras, números y símbolos.', 'error'); return;
      }

      const empresaSanitizada = formAuth.company.trim() || 'Mi Empresa';
      const telefonoSanitizado = formAuth.telefono.trim() || 'No provisto';
      
      const newUser = { 
        id: generateUUID(), email: emailSanitizado, company: empresaSanitizada, telefono: telefonoSanitizado,
        role: 'owner', plan: selectedPlanToRegister, registeredAt: Date.now(), diasRestantes: 30, estado: 'activo'
      };
      
      setClientesAdmin(prev => [...prev, {
        id: newUser.id, company: newUser.company, email: newUser.email, telefono: newUser.telefono,
        plan: newUser.plan, diasRestantes: 30, estado: 'activo', fechaRegistro: new Date().toISOString().split('T')[0]
      }]);

      setUser(newUser); 
      setFormPerfil({ company: newUser.company, email: newUser.email, newPassword: '', confirmPassword: '' });
      setIsLoggedIn(true); 
      addToast('Cuenta creada. Iniciando mes de prueba.', 'success');
      
      if (formAuth.remember) localStorage.setItem('rutaSync_session_token', btoa(JSON.stringify(newUser)));
    } else {
      if (emailSanitizado === 'admin@rutasync.com') {
        const adminUser = { id: 'admin_root', email: emailSanitizado, company: 'RutaSync Corp', role: 'superadmin', plan: 'corporativo' };
        setUser(adminUser);
        setFormPerfil({ company: adminUser.company, email: adminUser.email, newPassword: '', confirmPassword: '' });
        setIsLoggedIn(true);
        addToast('Consola de Administración Central desbloqueada.', 'success');
        if (formAuth.remember) localStorage.setItem('rutaSync_session_token', btoa(JSON.stringify(adminUser)));
        return;
      }

      const clienteEncontrado = clientesAdmin.find(c => c.email === emailSanitizado);
      if (clienteEncontrado) {
        if (clienteEncontrado.estado === 'bloqueado') { addToast('Cuenta suspendida. Contacte soporte.', 'error'); return; }
        const loggedUser = { id: clienteEncontrado.id, email: clienteEncontrado.email, company: clienteEncontrado.company, role: 'owner', plan: clienteEncontrado.plan, diasRestantes: clienteEncontrado.diasRestantes };
        setUser(loggedUser); 
        setFormPerfil({ company: loggedUser.company, email: loggedUser.email, newPassword: '', confirmPassword: '' });
        setIsLoggedIn(true); 
        addToast('Sesión iniciada.', 'success');
        if (formAuth.remember) localStorage.setItem('rutaSync_session_token', btoa(JSON.stringify(loggedUser)));
      } else {
        const defaultUser = { id: generateUUID(), email: emailSanitizado, company: 'Ferretería Demo', role: 'owner', plan: 'pyme', diasRestantes: 30 };
        setUser(defaultUser);
        setFormPerfil({ company: defaultUser.company, email: defaultUser.email, newPassword: '', confirmPassword: '' });
        setIsLoggedIn(true);
        addToast('Acceso demo autorizado.', 'success');
        if (formAuth.remember) localStorage.setItem('rutaSync_session_token', btoa(JSON.stringify(defaultUser)));
      }
    }
  };

  const handleLogout = () => { setIsLoggedIn(false); setShowLanding(true); setUser(null); localStorage.removeItem('rutaSync_session_token'); addToast('Sesión finalizada.', 'info'); };
  const handleForgotPassword = (e) => { e.preventDefault(); if (!formAuth.email) { addToast('Ingrese su correo.', 'error'); return; } addToast("Correo de recuperación enviado a " + formAuth.email, 'success'); setIsForgotMode(false); };

  const handleProductoPOSChange = (e) => {
    const val = e.target.value; let nuevoMonto = '';
    if (val !== 'custom' && val !== '') {
      const prod = inventario.find(p => p.id === val);
      if (prod) { const cant = parseInt(formPOS.cantidad) || 1; nuevoMonto = (prod.precio * cant).toFixed(2); }
    }
    setFormPOS({ ...formPOS, productoId: val, customPedido: '', total: nuevoMonto });
  };

  const handleCantidadPOSChange = (e) => {
    let val = parseInt(e.target.value);
    if (isNaN(val) || val < 1) val = 1;
    let nuevoMonto = formPOS.total;
    if (formPOS.productoId && formPOS.productoId !== 'custom') {
      const prod = inventario.find(p => p.id === formPOS.productoId);
      if (prod) { nuevoMonto = (prod.precio * val).toFixed(2); }
    }
    setFormPOS({ ...formPOS, cantidad: val.toString(), total: nuevoMonto });
  };

  const handleAddVentaPOS = (e) => {
    e.preventDefault();
    const cantNum = parseInt(formPOS.cantidad) || 1;
    const totalParseado = parseFloat(formPOS.total);
    if (cantNum <= 0 || isNaN(totalParseado) || totalParseado < 0) { addToast("Datos inválidos.", "error"); return; }

    let nombreDelPedido = formPOS.productoId === 'custom' ? formPOS.customPedido : '';
    if (formPOS.productoId !== 'custom') {
      const prod = inventario.find(p => p.id === formPOS.productoId);
      if (prod) {
        if (prod.cantidad < cantNum) { addToast("Stock insuficiente. Disp: " + prod.cantidad, 'error'); return; }
        nombreDelPedido = prod.nombre;
        setInventario(inventario.map(p => p.id === prod.id ? { ...p, cantidad: p.cantidad - cantNum } : p));
      }
    }
    setEntregas([...entregas, {
      id: generateUUID(), timestamp: Date.now(), fechaCorta: new Date().toLocaleDateString('es-GT'), cliente: formPOS.cliente || 'Cliente Mostrador', telefono: '', direccion: 'Compra en Tienda', pedido: nombreDelPedido,
      cantidad: cantNum, productoId: formPOS.productoId !== 'custom' ? formPOS.productoId : null, tipoEnvio: 'mostrador', responsable: 'Caja', total: totalParseado, estado: 'entregado', metodoPago: formPOS.metodoPago, firma: 'Venta Directa'
    }]);
    setFormPOS({ ...formPOS, cliente: 'Cliente Mostrador', cantidad: 1, total: '', customPedido: '', productoId: '' });
    addToast('Transacción registrada.', 'success');
  };

  const handleProductoChange = (e) => {
    const val = e.target.value; let nuevoMonto = '';
    if (val !== 'custom' && val !== '') {
      const prod = inventario.find(p => p.id === val);
      if (prod) { const cant = parseInt(formRuta.cantidad) || 1; nuevoMonto = (prod.precio * cant).toFixed(2); }
    }
    setFormRuta({ ...formRuta, productoId: val, customPedido: '', total: nuevoMonto });
  };

  const handleCantidadChange = (e) => {
    let val = parseInt(e.target.value);
    if (isNaN(val) || val < 1) val = 1;
    let nuevoMonto = formRuta.total;
    if (formRuta.productoId && formRuta.productoId !== 'custom') {
      const prod = inventario.find(p => p.id === formRuta.productoId);
      if (prod) { nuevoMonto = (prod.precio * val).toFixed(2); }
    }
    setFormRuta({ ...formRuta, cantidad: val.toString(), total: nuevoMonto });
  };

  const handleAddRuta = (e) => {
    e.preventDefault();
    const cantNum = parseInt(formRuta.cantidad) || 1;
    const totalParseado = parseFloat(formRuta.total);
    if (cantNum <= 0 || isNaN(totalParseado) || totalParseado < 0) { addToast("Datos inválidos.", "error"); return; }
    let nombreDelPedido = formRuta.productoId === 'custom' ? formRuta.customPedido : '';
    if (formRuta.productoId !== 'custom') {
      const prod = inventario.find(p => p.id === formRuta.productoId);
      if (prod) {
        if (prod.cantidad < cantNum) { addToast("Stock insuficiente. Disp: " + prod.cantidad, 'error'); return; }
        nombreDelPedido = prod.nombre;
        setInventario(inventario.map(p => p.id === prod.id ? { ...p, cantidad: p.cantidad - cantNum } : p));
      }
    }
    setEntregas([...entregas, {
      id: generateUUID(), timestamp: Date.now(), fechaCorta: new Date().toLocaleDateString('es-GT'), cliente: formRuta.cliente, telefono: formRuta.telefono, direccion: formRuta.direccion, pedido: nombreDelPedido,
      cantidad: cantNum, productoId: formRuta.productoId !== 'custom' ? formRuta.productoId : null, tipoEnvio: formRuta.tipoEnvio, responsable: formRuta.responsable, total: totalParseado, estado: 'pendiente', metodoPago: null, firma: null
    }]);
    setFormRuta({ ...formRuta, cliente: '', telefono: '', direccion: '', responsable: '', cantidad: 1, total: '', customPedido: '', productoId: '' });
    addToast('Orden generada.', 'success');
  };

  const eliminarRuta = (id) => {
    const entrega = entregas.find(e => e.id === id);
    if (entrega && entrega.productoId && entrega.estado !== 'entregado') { 
      setInventario(inventario.map(p => p.id === entrega.productoId ? { ...p, cantidad: p.cantidad + entrega.cantidad } : p)); addToast('Orden eliminada. Stock devuelto.', 'info'); 
    } else { addToast('Orden eliminada.', 'info'); }
    setEntregas(entregas.filter(e => e.id !== id));
  };
  
  const optimizarRuta = () => { setEntregas([...entregas].reverse()); addToast('Ruta optimizada.', 'success'); };
  const enviarLinkPiloto = () => { window.open("https://wa.me/?text=" + encodeURIComponent(`🏍️ *RutaSync ERP*\n\nRuta logística asignada:\n🔗 https://rutasync.com/piloto/${user?.company.split(' ').join('').toLowerCase()}`), '_blank'); };
  const notificarClienteFinal = (entrega) => { window.open(`https://wa.me/502${entrega.telefono}?text=${encodeURIComponent(`¡Hola ${entrega.cliente}! 🚚\n\nTu pedido va en camino con nuestro piloto ${entrega.responsable}.\n\nTotal a cobrar: Q${entrega.total.toFixed(2)}`)}`, '_blank'); };
  const abrirWaze = (direccion) => { window.open(`https://waze.com/ul?q=${encodeURIComponent(direccion + ", Guatemala")}&navigate=yes`, '_blank'); };
  const confirmarPOD = () => { setEntregas(entregas.map(e => e.id === modalEntrega ? { ...e, estado: 'entregado', metodoPago: formPOD.metodoPago, firma: formPOD.firma || 'Sin Firma' } : e)); setModalEntrega(null); setFormPOD({ metodoPago: 'efectivo', firma: '', fotoCapturada: false }); addToast('Entrega registrada.', 'success'); };

  const handleAddStock = (e) => { 
    e.preventDefault(); 
    const cantNum = parseInt(formStock.cantidad); const preNum = parseFloat(formStock.precio); const minNum = parseInt(formStock.minimo);
    if (cantNum < 0 || preNum < 0 || minNum < 0) { addToast('Valores negativos no permitidos.', 'error'); return; }
    setInventario([...inventario, { id: generateUUID(), nombre: formStock.nombre, cantidad: cantNum, precio: preNum, minimo: minNum }]); 
    setFormStock({ nombre: '', cantidad: '', precio: '', minimo: '' }); addToast('Material ingresado.', 'success'); 
  };
  const modificarStock = (id, delta) => { setInventario(inventario.map(p => { if (p.id === id) { const nc = p.cantidad + delta; if (nc >= 0) return { ...p, cantidad: nc }; else addToast('Stock no puede ser menor a cero.', 'error'); } return p; })); };
  const eliminarProducto = (id) => { setInventario(inventario.filter(p => p.id !== id)); addToast('Material dado de baja.', 'info'); };
  
  const handleFileUpload = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result; const rows = text.split('\n').filter(row => row.trim() !== ''); const nuevosProductos = [];
        for (let i = 1; i < rows.length; i++) {
          const cols = rows[i].split(/[,;]/); 
          if (cols.length >= 3) { 
            let cant = parseInt(cols[1]); let prec = parseFloat(cols[2]); let min = parseInt(cols[3]);
            if (cant >= 0 && prec >= 0) nuevosProductos.push({ id: generateUUID(), nombre: cols[0] ? cols[0].trim() : 'N/A', cantidad: cant, precio: prec, minimo: min || 5 }); 
          }
        }
        if (nuevosProductos.length > 0) { setInventario(prev => [...prev, ...nuevosProductos]); addToast("Importación exitosa.", 'success'); } 
        else addToast('Formato CSV incorrecto.', 'error');
      } catch (err) { addToast('Error de lectura.', 'error'); }
    };
    reader.readAsText(file); e.target.value = null; 
  };

  const handleAddEvento = (e) => { 
    e.preventDefault(); const partes = formEvento.fecha.split('-'); const fechaArmada = new Date(parseInt(partes[0]), parseInt(partes[1]) - 1, parseInt(partes[2]), 0, 0, 0);
    setEventos([...eventos, { id: generateUUID(), titulo: formEvento.titulo, fechaReal: fechaArmada.getTime(), dia: partes[2], mes: partes[1], anio: partes[0], detalles: formEvento.detalles }]); 
    setFormEvento({ titulo: '', fecha: '', detalles: '' }); addToast('Evento guardado.', 'success'); 
  };
  const eliminarEvento = (id) => setEventos(eventos.filter(e => e.id !== id));
  
  const handleAddGasto = (e) => { 
    e.preventDefault(); const montoValidado = parseFloat(formGasto.monto);
    if (isNaN(montoValidado) || montoValidado <= 0) { addToast("Monto inválido.", "error"); return; }
    setGastos([...gastos, { id: generateUUID(), timestamp: Date.now(), fecha: new Date().toLocaleDateString('es-GT'), descripcion: formGasto.descripcion, monto: montoValidado }]); 
    setFormGasto({ descripcion: '', monto: '' }); addToast('Gasto registrado.', 'success'); 
  };
  const eliminarGasto = (id) => setGastos(gastos.filter(g => g.id !== id));

  const extenderSuscripcion = (id) => {
    setClientesAdmin(clientesAdmin.map(c => {
      if (c.id === id) { addToast(`Suscripción extendida para ${c.company}`, 'success'); return { ...c, diasRestantes: c.diasRestantes + 30 }; }
      return c;
    }));
  };
  const alternarEstadoCliente = (id) => {
    setClientesAdmin(clientesAdmin.map(c => {
      if (c.id === id) { const nuevoEstado = c.estado === 'activo' ? 'bloqueado' : 'activo'; addToast(`Estado actualizado: ${nuevoEstado}`, 'info'); return { ...c, estado: nuevoEstado }; }
      return c;
    }));
  };
  const handleAddNotaAdmin = (e) => {
    e.preventDefault();
    if (!nuevaNota.trim()) return;
    setNotasAdmin([...notasAdmin, { id: generateUUID(), nota: nuevaNota.trim() }]);
    setNuevaNota(''); addToast('Nota guardada.', 'success');
  };
  const eliminarNotaAdmin = (id) => {
    setNotasAdmin(notasAdmin.filter(n => n.id !== id)); addToast('Nota eliminada.', 'info');
  };
  const handleUpdatePerfil = (e) => {
    e.preventDefault();
    if (formPerfil.newPassword && formPerfil.newPassword !== formPerfil.confirmPassword) { addToast('Las contraseñas no coinciden.', 'error'); return; }
    addToast('Perfil actualizado.', 'success');
  };

  const filtrarData = (dataArray, rango) => {
    if (rango === 'todos') return dataArray;
    const limit = new Date(); limit.setHours(0,0,0,0);
    if (rango === '7dias') limit.setDate(limit.getDate() - 7); 
    else if (rango === '1mes') limit.setMonth(limit.getMonth() - 1); 
    else if (rango === 'trimestre') limit.setMonth(limit.getMonth() - 3); 
    else if (rango === 'anual') limit.setFullYear(limit.getFullYear() - 1);
    const limitTime = limit.getTime(); return dataArray.filter(item => item.timestamp >= limitTime);
  };
  
  const valorTotalInventario = inventario.reduce((acc, p) => acc + (p.cantidad * p.precio), 0);
  const entregasHistorial = filtrarData(entregas, filtroHistorial);
  const entregasFinanzas = filtrarData(entregas, filtroFinanzas);
  const gastosFinanzas = filtrarData(gastos, filtroFinanzas);
  
  const ingresosPagados = entregasFinanzas.filter(e => e.estado === 'entregado').reduce((acc, e) => acc + e.total, 0);
  const cuentasPorCobrar = entregasFinanzas.filter(e => e.estado === 'pendiente').reduce((acc, e) => acc + e.total, 0);
  const totalGastosOperativos = gastosFinanzas.reduce((acc, g) => acc + g.monto, 0);
  const utilidadNeta = ingresosPagados - totalGastosOperativos;
  const margenGastos = ingresosPagados > 0 ? (totalGastosOperativos / ingresosPagados) * 100 : 0;
  const margenUtilidad = ingresosPagados > 0 ? (utilidadNeta / ingresosPagados) * 100 : 0;

  const mrrAcumulado = clientesAdmin.filter(c => c.estado === 'activo').reduce((acc, c) => acc + (c.plan === 'emprendedor' ? 99 : (c.plan === 'pyme' ? 249 : 599)), 0);
  const liquidacionPilotos = {};
  entregasFinanzas.filter(e => e.estado === 'entregado').forEach(e => {
    if (!liquidacionPilotos[e.responsable]) liquidacionPilotos[e.responsable] = { efectivo: 0, digital: 0 };
    if (e.metodoPago === 'efectivo') liquidacionPilotos[e.responsable].efectivo += e.total;
    else liquidacionPilotos[e.responsable].digital += e.total;
  });

  const chartDataRaw = {};
  entregasFinanzas.filter(e => e.estado === 'entregado').forEach(e => { chartDataRaw[e.fechaCorta] = (chartDataRaw[e.fechaCorta] || 0) + e.total; });
  const chartData = Object.keys(chartDataRaw).map(k => ({ date: k, amount: chartDataRaw[k] }));

  if (showPDF) {
    return (
      <div className="min-h-screen w-full bg-slate-200 p-4 md:p-8 flex flex-col items-center overflow-y-auto font-sans">
        <div className="w-full max-w-4xl flex justify-between items-center mb-6 print:hidden bg-white p-4 rounded shadow-md">
          <div className="flex items-center gap-2 text-slate-800 font-bold uppercase tracking-wider text-sm">
            <FileText size={18} className="text-blue-600"/> Acta Oficial de Resultados
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowPDF(false)} className="bg-slate-200 text-slate-700 px-4 py-2 rounded text-xs font-bold uppercase tracking-wider shadow-sm flex items-center gap-2 hover:bg-slate-300 transition">
              <ArrowLeft size={14}/> Volver al ERP
            </button>
            <button onClick={() => window.print()} className="bg-slate-900 text-white px-4 py-2 rounded text-xs font-bold uppercase tracking-wider shadow-md flex items-center gap-2 hover:bg-slate-800 transition">
              <Printer size={14}/> Imprimir
            </button>
          </div>
        </div>
        <div id="acta-pdf-documento" className="w-full max-w-4xl bg-white text-black p-10 md:p-16 shadow-2xl print:shadow-none">
          <div className="text-center border-b-2 border-slate-800 pb-6 mb-8">
            <h1 className="text-3xl font-extrabold uppercase tracking-widest text-slate-900">{user?.company}</h1>
            <h2 className="text-xl font-bold text-slate-700 mt-2 uppercase tracking-wide">Acta de Resultados Financieros</h2>
            <p className="mt-2 text-sm text-slate-500">Fecha de Emisión: {new Date().toLocaleDateString('es-GT')}</p>
          </div>
          <div className="grid grid-cols-2 gap-6 mb-10">
            <div className="border border-slate-300 p-4">
              <span className="block text-xs uppercase font-bold text-slate-500 mb-1">Ingresos Brutos Verificados</span>
              <span className="text-2xl font-bold text-slate-900">Q {ingresosPagados.toLocaleString('es-GT', {minimumFractionDigits:2})}</span>
            </div>
            <div className="border border-slate-300 p-4">
              <span className="block text-xs uppercase font-bold text-slate-500 mb-1">Utilidad Neta Realizada</span>
              <span className="text-2xl font-bold text-slate-900">Q {utilidadNeta.toLocaleString('es-GT', {minimumFractionDigits:2})}</span>
            </div>
          </div>
          <div className="mt-20 pt-8 border-t border-slate-300 text-center"><p className="text-xs font-bold uppercase">Sello y Firma Autorizada</p></div>
        </div>
      </div>
    );
  }

  if (showDriverView) {
    const rutasPiloto = entregas.filter(e => e.tipoEnvio === 'propio' && e.estado === 'pendiente');
    return (
      <div className="h-screen w-full bg-slate-900 text-white font-sans flex flex-col max-w-md mx-auto shadow-2xl overflow-hidden relative">
        <div className="bg-slate-950 border-b border-slate-800 p-4 shadow-md z-10 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Bike size={20} className="text-cyan-400" />
            <h1 className="font-bold text-lg leading-none">RutaSync <span className="font-light text-slate-400 text-sm">Piloto</span></h1>
          </div>
          <button onClick={() => setShowDriverView(false)} className="text-xs bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-full font-bold uppercase tracking-wider text-slate-300 hover:text-white transition flex items-center gap-1">
            <LogOut size={12}/> Salir
          </button>
        </div>
        
        {modalEntrega && (
          <div className="absolute inset-0 bg-slate-900/90 z-50 flex items-end justify-center backdrop-blur-md animate-fade-in">
            <div className="bg-slate-800 border-t border-slate-700 w-full rounded-t-2xl p-6 shadow-2xl animate-slide-up">
              <h3 className="font-bold text-lg text-white mb-4 flex items-center gap-2">
                <CheckCircle size={20} className="text-cyan-400"/> Confirmar Entrega
              </h3>
              
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">Método de Pago Recibido</label>
              <div className="grid grid-cols-3 gap-2 mb-4">
                <button onClick={()=>setFormPOD({...formPOD, metodoPago:'efectivo'})} className={"py-2 rounded-lg border text-xs font-bold flex flex-col items-center gap-1 transition-all " + (formPOD.metodoPago==='efectivo'?'bg-cyan-500/20 border-cyan-500/50 text-cyan-400':'bg-slate-700/50 text-slate-400 border-slate-600')}>
                  <Wallet size={16}/> Efectivo
                </button>
                <button onClick={()=>setFormPOD({...formPOD, metodoPago:'transferencia'})} className={"py-2 rounded-lg border text-xs font-bold flex flex-col items-center gap-1 transition-all " + (formPOD.metodoPago==='transferencia'?'bg-blue-500/20 border-blue-500/50 text-blue-400':'bg-slate-700/50 text-slate-400 border-slate-600')}>
                  <Smartphone size={16}/> Transf.
                </button>
                <button onClick={()=>setFormPOD({...formPOD, metodoPago:'tarjeta'})} className={"py-2 rounded-lg border text-xs font-bold flex flex-col items-center gap-1 transition-all " + (formPOD.metodoPago==='tarjeta'?'bg-purple-500/20 border-purple-500/50 text-purple-400':'bg-slate-700/50 text-slate-400 border-slate-600')}>
                  <CreditCard size={16}/> Tarjeta
                </button>
              </div>

              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">Evidencia y Firma</label>
              <div className="space-y-3 mb-6">
                <div className="relative">
                  <PenTool className="absolute left-3 top-2.5 text-slate-500" size={16} />
                  <input type="text" placeholder="Nombre de quien recibe / DPI" value={formPOD.firma} onChange={e=>setFormPOD({...formPOD, firma: e.target.value})} className="w-full pl-9 pr-3 py-2.5 bg-slate-900/50 border border-slate-700 rounded-lg text-sm text-white focus:border-cyan-500 outline-none" />
                </div>
                <label className={"w-full py-3 rounded-lg border border-dashed flex justify-center items-center gap-2 text-sm font-bold transition cursor-pointer " + (formPOD.fotoCapturada?'bg-cyan-500/20 border-cyan-500/50 text-cyan-400':'bg-slate-900/50 border-slate-600 text-slate-400')}>
                  <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e)=>{ if(e.target.files && e.target.files[0]) setFormPOD({...formPOD, fotoCapturada: true}) }} />
                  {formPOD.fotoCapturada ? <><CheckCircle size={16}/> Evidencia Capturada</> : <><Camera size={16}/> Tomar Fotografía</>}
                </label>
              </div>
              <div className="flex gap-3">
                <button onClick={()=>setModalEntrega(null)} className="flex-1 py-3 bg-slate-700 text-slate-300 border border-slate-600 font-bold rounded-xl hover:bg-slate-600 transition">Cancelar</button>
                <button onClick={confirmarPOD} className="flex-1 py-3 bg-cyan-500 text-slate-900 font-bold rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:bg-cyan-400 transition">Completar</button>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 p-3 rounded-xl text-sm font-medium text-center shadow-[0_0_15px_rgba(6,182,212,0.1)]">
            Tienes <strong>{rutasPiloto.length}</strong> paradas pendientes hoy.
          </div>
          {rutasPiloto.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500">
              <CheckCircle size={48} className="text-cyan-500/50 mb-4"/>
              <p className="font-bold uppercase tracking-wider">Ruta Finalizada</p>
            </div>
          ) : (
            rutasPiloto.map((e, index) => (
              <div key={e.id} className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 overflow-hidden">
                <div className="bg-slate-900 text-white px-3 py-2 text-[10px] font-bold uppercase tracking-wider flex justify-between items-center border-b border-slate-700">
                  <span className="text-cyan-400">Parada #{index + 1}</span>
                  <span className="bg-slate-800 border border-slate-600 px-2 py-0.5 rounded text-[10px]">Cobrar: Q{e.total.toFixed(2)}</span>
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Destino</p>
                    <p className="font-bold text-white text-lg leading-tight">{e.direccion}</p>
                  </div>
                  <div className="flex justify-between items-center bg-slate-900/50 p-2.5 rounded-lg border border-slate-700">
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Cliente</p>
                      <p className="font-semibold text-slate-300 text-sm flex items-center gap-1.5"><User size={12} className="text-cyan-500"/> {e.cliente}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Carga a Entregar</p>
                    <p className="text-sm font-medium text-slate-300"><span className="font-bold text-white">{e.cantidad}x</span> {e.pedido}</p>
                  </div>
                  <div className="pt-2 grid grid-cols-2 gap-3 mt-1">
                    <button onClick={() => abrirWaze(e.direccion)} className="bg-slate-700 text-slate-200 border border-slate-600 font-bold py-3.5 rounded-xl text-xs flex justify-center items-center gap-2 hover:bg-slate-600 transition">
                      <Navigation size={16}/> Waze
                    </button>
                    <button onClick={() => setModalEntrega(e.id)} className="bg-cyan-500 text-slate-900 font-bold py-3.5 rounded-xl text-xs flex justify-center items-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:bg-cyan-400 transition">
                      <CheckCircle size={16}/> Entregar
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  if (!isLoggedIn && showLanding) {
    return (
      <div className="min-h-screen bg-slate-950 font-sans flex flex-col overflow-y-auto selection:bg-cyan-500/30 text-slate-300 relative">
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20"></div>
          <div className="absolute top-[10%] left-[20%] w-[500px] h-[500px] rounded-full bg-cyan-600/10 blur-[120px] mix-blend-screen"></div>
          <div className="absolute bottom-[10%] right-[10%] w-[600px] h-[600px] rounded-full bg-blue-600/10 blur-[150px] mix-blend-screen"></div>
        </div>

        <nav className="px-6 py-5 flex justify-between items-center sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="bg-cyan-500 text-slate-900 p-2 rounded-lg shadow-[0_0_15px_rgba(6,182,212,0.5)]"><MapIcon size={20} className="font-bold" /></div>
            <span className="text-2xl font-extrabold tracking-tight text-white">RutaSync <span className="font-light text-cyan-400">ERP</span></span>
          </div>
          <div className="flex items-center gap-6">
            <button onClick={() => handleNavigateToAuth(false)} className="text-sm font-semibold text-slate-300 hover:text-white transition hidden sm:block">Iniciar Sesión</button>
            <button onClick={() => handleNavigateToAuth(true, 'pyme')} className="bg-transparent border border-cyan-500 text-cyan-400 px-5 py-2 rounded-full text-sm font-bold hover:bg-cyan-500 hover:text-slate-900 transition-all shadow-[0_0_10px_rgba(6,182,212,0.2)] hover:shadow-[0_0_20px_rgba(6,182,212,0.6)]">
              Comenzar Gratis
            </button>
          </div>
        </nav>
        
        <section className="px-6 py-24 text-center max-w-6xl mx-auto flex flex-col items-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-slate-800/50 border border-slate-700 text-cyan-400 font-mono px-4 py-1.5 rounded-full text-xs mb-8 uppercase tracking-widest backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span> Sistema de Gestión Empresarial
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold text-white leading-tight mb-6 tracking-tight">
            RutaSync es la capa crítica <br className="hidden md:block" />
            que impulsa su <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Logística.</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-400 mb-12 max-w-3xl leading-relaxed font-light">
            Estandarice sus procesos operativos, controle el efectivo de sus pilotos en tiempo real y genere inteligencia financiera automatizada para el mercado B2B en Guatemala.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 w-full sm:w-auto">
            <button onClick={() => handleNavigateToAuth(true, 'pyme')} className="group relative bg-cyan-500 text-slate-900 px-8 py-4 rounded-full text-lg font-bold transition-all flex justify-center items-center gap-2 overflow-hidden hover:scale-105 shadow-[0_0_20px_rgba(6,182,212,0.4)]">
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
              Acelere su negocio <ArrowRight size={20} />
            </button>
            <button onClick={() => document.getElementById('planes-seccion')?.scrollIntoView({ behavior: 'smooth' })} className="bg-slate-800/50 text-white border border-slate-700 px-8 py-4 rounded-full text-lg font-medium hover:bg-slate-800 transition-all backdrop-blur-sm">
              Ver Soluciones
            </button>
          </div>
        </section>

        <section id="planes-seccion" className="py-24 relative z-10 border-t border-slate-800 bg-slate-900/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Infraestructura Escalable</h2>
              <p className="text-slate-400">Planes diseñados para crecer con usted. Sin contratos forzosos. Cancele en cualquier momento.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
              <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 hover:border-cyan-500/30 transition-all flex flex-col group relative overflow-hidden shadow-lg">
                <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors">Emprendedor</h3>
                <p className="text-sm text-slate-400 mb-6 flex-1">Para negocios independientes y operaciones locales que inician su digitalización.</p>
                <div className="text-4xl font-extrabold text-white mb-6">Q99<span className="text-lg text-slate-500 font-normal">/mes</span></div>
                <ul className="space-y-4 text-sm text-slate-300 mb-8 font-medium">
                  <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-cyan-500"/> Hasta 200 entregas mensuales</li>
                  <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-cyan-500"/> 1 Usuario Administrador</li>
                  <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-cyan-500"/> Importación masiva (CSV)</li>
                  <li className="flex items-center gap-3 text-emerald-400"><MessageCircle size={18}/> Soporte por WhatsApp</li>
                </ul>
                <button onClick={() => handleNavigateToAuth(true, 'emprendedor')} className="w-full mt-auto py-3 rounded-xl border border-cyan-500/30 font-bold text-cyan-400 hover:bg-cyan-500/10 transition">Iniciar Prueba Gratis</button>
              </div>

              <div className="bg-slate-800 border border-cyan-500/60 rounded-2xl p-8 shadow-[0_0_30px_rgba(6,182,212,0.15)] relative transform md:-translate-y-4 flex flex-col">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-cyan-500 text-slate-900 px-5 py-1 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.5)]">
                  <Zap size={14}/> Recomendado
                </div>
                <h3 className="text-2xl font-bold text-white mb-2 mt-2">Plan PYME</h3>
                <p className="text-sm text-slate-400 mb-6 flex-1">Para flotas activas que requieren control de cobros e inventario en tiempo real.</p>
                <div className="text-4xl font-extrabold text-cyan-400 mb-6">Q249<span className="text-lg text-slate-500 font-normal">/mes</span></div>
                <ul className="space-y-4 text-sm text-slate-200 mb-8 font-medium">
                  <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-cyan-400"/> Hasta 1,200 entregas mensuales</li>
                  <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-cyan-400"/> Liquidación de Efectivo</li>
                  <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-cyan-400"/> Prueba de Entrega (Foto y Firma)</li>
                  <li className="flex items-center gap-3 text-cyan-300"><Star size={18}/> Soporte Prioritario 24/7</li>
                </ul>
                <button onClick={() => handleNavigateToAuth(true, 'pyme')} className="w-full mt-auto py-4 rounded-xl bg-cyan-500 text-slate-900 font-bold hover:bg-cyan-400 transition shadow-[0_0_20px_rgba(6,182,212,0.3)]">Activar Entorno</button>
              </div>

              <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 hover:border-cyan-500/30 transition-all flex flex-col group relative overflow-hidden shadow-lg">
                <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors">Corporativo</h3>
                <p className="text-sm text-slate-400 mb-6 flex-1">Infraestructura dedicada para cadenas o distribuidoras con alto volumen.</p>
                <div className="text-4xl font-extrabold text-white mb-6">Q599<span className="text-lg text-slate-500 font-normal">/mes</span></div>
                <ul className="space-y-4 text-sm text-slate-300 mb-8 font-medium">
                  <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-cyan-500"/> Entregas Ilimitadas</li>
                  <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-cyan-500"/> Gestión Multi-Sucursal</li>
                  <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-cyan-500"/> Acceso a API</li>
                  <li className="flex items-center gap-3 text-slate-400"><Globe size={18}/> Asesor de Cuenta Asignado</li>
                </ul>
                <button onClick={() => handleNavigateToAuth(true, 'corporativo')} className="w-full mt-auto py-3 rounded-xl border border-slate-600 font-bold text-white hover:bg-slate-800 transition">Contactar Ventas</button>
              </div>
            </div>
          </div>
        </section>

        <footer className="w-full border-t border-slate-800 bg-slate-950 py-12 relative z-10">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <h3 className="text-xl font-bold text-white mb-3">¿Necesita un plan a la medida o soporte empresarial?</h3>
            <p className="text-slate-400 mb-6 font-medium">Nuestro equipo en Guatemala está listo para ayudarle a transformar su logística.</p>
            <a href="mailto:Atencionrutasync@gmail.com" className="inline-flex items-center justify-center gap-3 bg-cyan-500 text-slate-900 px-8 py-4 rounded-xl font-bold hover:bg-cyan-400 transition-all duration-300 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <Mail size={20} />
              Atencionrutasync@gmail.com
            </a>
            <div className="mt-12 flex justify-center gap-6 text-sm text-slate-500 font-medium">
              <button onClick={() => setLegalModal('terminos')} className="hover:text-cyan-400 transition">Términos de Servicio</button>
              <span>|</span>
              <button onClick={() => setLegalModal('privacidad')} className="hover:text-cyan-400 transition">Privacidad</button>
            </div>
          </div>
        </footer>

        {legalModal && (
          <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[100] flex justify-center items-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl flex flex-col shadow-2xl relative" style={{maxHeight: '80vh'}}>
              <div className="flex justify-between items-center p-6 border-b border-slate-800 shrink-0">
                <h2 className="text-xl font-bold text-white">{legalModal === 'terminos' ? 'Términos de Servicio Comercial' : 'Política de Privacidad y Ciberseguridad'}</h2>
                <button onClick={() => setLegalModal(null)} className="text-slate-400 hover:text-red-400 transition text-3xl leading-none">&times;</button>
              </div>
              <div className="p-6 overflow-y-auto text-sm text-slate-300 space-y-4 text-left font-light leading-relaxed flex-1 scrollbar-thin scrollbar-thumb-cyan-500/50 scrollbar-track-transparent">
                  <p><strong className="text-cyan-400">Última actualización:</strong> Junio 2026</p>
                  {legalModal === 'terminos' ? (
                    <>
                      <p>RutaSync ("nosotros", "la Empresa") provee una plataforma de Software como Servicio (SaaS) orientada a la gestión de inventarios y logística comercial para empresas (B2B).</p>
                      <h3 className="font-bold text-white mt-4">1. Naturaleza del Servicio</h3>
                      <p>RutaSync es estrictamente un proveedor de herramientas tecnológicas. No somos una empresa de transporte, mensajería, ni nos hacemos responsables por la mercancía extraviada o dañada por los pilotos de la empresa contratante.</p>
                      <h3 className="font-bold text-white mt-4">2. Pagos y Suscripciones</h3>
                      <p>El uso del sistema requiere el pago de una suscripción mensual prepagada. No existen contratos de permanencia forzosa. El usuario puede cancelar su suscripción en cualquier momento, perdiendo acceso a las funciones premium al finalizar su ciclo facturado.</p>
                      <h3 className="font-bold text-white mt-4">3. Aceptación Legal</h3>
                      <p>Conforme al Decreto 47-2008 (Ley para el Reconocimiento de las Comunicaciones y Firmas Electrónicas de Guatemala), al marcar la casilla de aceptación y crear una cuenta, usted formaliza su ingreso legal a nuestra plataforma, comprometiéndose al buen uso de la misma y validando que posee la autoridad legal para representar a la empresa registrada.</p>
                    </>
                  ) : (
                    <>
                      <p>El cuidado de su información corporativa es nuestra máxima prioridad. Esta política detalla cómo manejamos sus datos dentro de la infraestructura de RutaSync.</p>
                      <h3 className="font-bold text-white mt-4">1. Recopilación de Datos</h3>
                      <p>Recopilamos únicamente la información necesaria para el funcionamiento del ERP: nombres de clientes finales, direcciones de entrega, números de teléfono y registros de inventario ingresados por la empresa titular de la cuenta.</p>
                      <h3 className="font-bold text-white mt-4">2. Privacidad Absoluta (Apego Constitucional)</h3>
                      <p>En estricto apego al Artículo 31 de la Constitución Política de la República de Guatemala, RutaSync garantiza que <strong className="text-white">NO vendemos, NO compartimos y NO alquilamos</strong> su base de datos de clientes ni su información financiera a terceros bajo ninguna circunstancia.</p>
                      <h3 className="font-bold text-white mt-4">3. Ciberseguridad y Encriptación</h3>
                      <p>Las contraseñas de todos los usuarios son encriptadas bajo protocolos de hash irreversibles antes de ser almacenadas en nuestros servidores en la nube. Ningún empleado de RutaSync, incluido el equipo de soporte técnico, tiene acceso a sus contraseñas en texto plano.</p>
                    </>
                  )}
              </div>
              <div className="p-4 border-t border-slate-800 flex justify-end shrink-0 bg-slate-950 rounded-b-2xl">
                <button onClick={() => setLegalModal(null)} className="bg-cyan-500 text-slate-900 px-6 py-2 rounded-lg font-bold hover:bg-cyan-400 transition shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                  Entendido y Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (!isLoggedIn && !showLanding) {
    return (
      <div className="min-h-screen w-full flex bg-slate-950 font-sans relative overflow-y-auto text-slate-300 py-10 px-4 selection:bg-cyan-500/30">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-900/20 via-slate-950 to-slate-950 pointer-events-none fixed"></div>
        <div className="w-full max-w-md m-auto bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl p-6 md:p-8 relative z-10 h-auto my-auto">
          <button onClick={() => setShowLanding(true)} className="text-slate-400 hover:text-cyan-400 flex items-center gap-2 mb-6 text-[10px] uppercase font-bold tracking-widest transition-colors">
            <ArrowLeft size={14} /> Volver al Inicio
          </button>
          
          <div className="flex items-center gap-2 mb-6">
            <div className="bg-cyan-500 text-slate-900 p-1.5 rounded shadow-[0_0_10px_rgba(6,182,212,0.5)]"><MapIcon size={18} /></div>
            <span className="text-xl font-bold tracking-tight text-white uppercase">RutaSync <span className="font-light text-cyan-400">Portal</span></span>
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-2">
            {isForgotMode ? 'Recuperar Acceso' : (isRegisterMode ? 'Crear Entorno de Trabajo' : 'Inicio de Sesión')}
          </h2>
          <p className="text-slate-400 text-sm mb-6 font-light">
            {isForgotMode ? 'Enviaremos instrucciones seguras a su correo.' : (isRegisterMode ? 'Inicialice la base de datos para su empresa.' : 'Ingrese sus credenciales de administrador.')}
          </p>
          
          {isRegisterMode && (
            <div className="mb-6 p-4 bg-slate-800/80 border border-slate-700 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest mb-1">Plan Seleccionado</p>
                <p className="text-white font-bold capitalize text-sm flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-cyan-500"/> Plan {selectedPlanToRegister}
                </p>
              </div>
              <button type="button" onClick={() => setShowLanding(true)} className="text-xs font-bold bg-slate-900 px-3 py-1.5 rounded-lg text-slate-300 hover:text-white border border-slate-700 transition-colors">
                Cambiar
              </button>
            </div>
          )}

          {isForgotMode ? (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Correo Corporativo</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 text-slate-500" size={16} />
                  <input type="email" required value={formAuth.email} onChange={e => setFormAuth({...formAuth, email: e.target.value})} className="w-full pl-10 pr-4 py-2.5 bg-slate-950/50 border border-slate-700 rounded-xl text-white text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all" />
                </div>
              </div>
              <button type="submit" className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold py-3 rounded-xl text-sm transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] mt-4">
                Enviar Enlace de Recuperación
              </button>
              <button type="button" onClick={() => setIsForgotMode(false)} className="w-full text-xs font-bold text-slate-400 hover:text-white mt-2 transition-colors">
                Cancelar
              </button>
            </form>
          ) : (
            <form onSubmit={handleAuth} className="space-y-4">
              {isRegisterMode && (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Nombre de la Empresa</label>
                    <div className="relative">
                      <Building className="absolute left-3 top-3 text-slate-500" size={16} />
                      <input type="text" required value={formAuth.company} onChange={e => setFormAuth({...formAuth, company: e.target.value})} className="w-full pl-10 pr-4 py-2.5 bg-slate-950/50 border border-slate-700 rounded-xl text-white text-sm focus:border-cyan-500 focus:ring-1 outline-none transition-all" placeholder="Ej. Distribuidora El Sol" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Teléfono / WhatsApp</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 text-slate-500" size={16} />
                      <input type="tel" value={formAuth.telefono} onChange={e => setFormAuth({...formAuth, telefono: e.target.value})} className="w-full pl-10 pr-4 py-2.5 bg-slate-950/50 border border-slate-700 rounded-xl text-white text-sm focus:border-cyan-500 focus:ring-1 outline-none transition-all" />
                    </div>
                  </div>
                </>
              )}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Correo Electrónico</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 text-slate-500" size={16} />
                  <input type="email" required value={formAuth.email} onChange={e => setFormAuth({...formAuth, email: e.target.value})} className="w-full pl-10 pr-4 py-2.5 bg-slate-950/50 border border-slate-700 rounded-xl text-white text-sm focus:border-cyan-500 focus:ring-1 outline-none transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Clave de Seguridad</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 text-slate-500" size={16} />
                  <input type="password" required value={formAuth.password} onChange={e => setFormAuth({...formAuth, password: e.target.value})} className="w-full pl-10 pr-4 py-2.5 bg-slate-950/50 border border-slate-700 rounded-xl text-white text-sm focus:border-cyan-500 focus:ring-1 outline-none transition-all" />
                </div>
                {isRegisterMode && (
                  <div className="mt-2 text-[10px] space-y-1 bg-slate-950/50 p-2.5 rounded-lg border border-slate-800 font-mono">
                    <p className={formAuth.password.length >= 8 ? "text-cyan-400" : "text-slate-500"}>[ {formAuth.password.length >= 8 ? '✓' : 'x'} ] Mínimo 8 caracteres</p>
                    <p className={/[A-Z]/.test(formAuth.password) && /[a-z]/.test(formAuth.password) ? "text-cyan-400" : "text-slate-500"}>[ {/[A-Z]/.test(formAuth.password) && /[a-z]/.test(formAuth.password) ? '✓' : 'x'} ] Mayúsculas y minúsculas</p>
                    <p className={/[0-9]/.test(formAuth.password) ? "text-cyan-400" : "text-slate-500"}>[ {/[0-9]/.test(formAuth.password) ? '✓' : 'x'} ] Número incluido</p>
                    <p className={/[^A-Za-z0-9]/.test(formAuth.password) ? "text-cyan-400" : "text-slate-500"}>[ {/[^A-Za-z0-9]/.test(formAuth.password) ? '✓' : 'x'} ] Símbolo especial (Ej: @, #, $)</p>
                  </div>
                )}
              </div>
              
              {isRegisterMode && (
                <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700 mt-2">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" required checked={formAuth.acceptTerms} onChange={e => setFormAuth({...formAuth, acceptTerms: e.target.checked})} className="mt-1 bg-slate-900 border-slate-600 text-cyan-500 rounded focus:ring-cyan-500 w-4 h-4 shrink-0" />
                    <span className="text-xs text-slate-400 leading-relaxed font-light">
                      Confirmo autorización legal bajo los <button type="button" onClick={() => setLegalModal('terminos')} className="text-cyan-400 font-bold hover:underline">Términos de Servicio</button> y la <button type="button" onClick={() => setLegalModal('privacidad')} className="text-cyan-400 font-bold hover:underline">Política de Privacidad</button>.
                    </span>
                  </label>
                </div>
              )}

              <div className="flex items-center justify-between mt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={formAuth.remember} onChange={e => setFormAuth({...formAuth, remember: e.target.checked})} className="bg-slate-900 border-slate-600 text-cyan-500 rounded focus:ring-cyan-500" />
                  <span className="text-xs text-slate-400 font-medium">Mantener sesión activa</span>
                </label>
                {!isRegisterMode && (
                  <button type="button" onClick={() => setIsForgotMode(true)} className="text-xs font-bold text-cyan-400 hover:text-cyan-300 transition">¿Olvidó su clave?</button>
                )}
              </div>
              
              <button type="submit" className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold py-3.5 rounded-xl text-sm transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] mt-4 flex justify-center items-center gap-2">
                {isRegisterMode ? 'Inicializar Entorno' : 'Autenticar Ingreso'} <ChevronRight size={18} />
              </button>
            </form>
          )}
          
          <div className="mt-6 pt-5 border-t border-slate-800 text-center">
            <p className="text-slate-400 text-xs font-medium">
              {isRegisterMode ? '¿Ya tiene acceso a su empresa?' : '¿Aún no tiene infraestructura con nosotros?'}
              <button onClick={() => setIsRegisterMode(!isRegisterMode)} className="ml-2 text-white font-bold uppercase tracking-wide hover:text-cyan-400 transition-colors">
                {isRegisterMode ? 'Inicie Sesión' : 'Cree su Cuenta'}
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col bg-slate-900 text-slate-300 font-sans print:bg-white print:text-black selection:bg-cyan-500/30">
      
      {/* HEADER SUPERIOR */}
      <header className="bg-slate-950 border-b border-slate-800 px-4 py-2.5 flex justify-between items-center z-20 shrink-0 print:hidden">
        <div className="flex items-center gap-4">
          <div className="bg-cyan-500/10 border border-cyan-500/30 p-1.5 rounded-lg shadow-[0_0_10px_rgba(6,182,212,0.2)]"><MapIcon size={18} className="text-cyan-400"/></div>
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-wider leading-none uppercase text-white">RUTASYNC ERP</span>
            <span className="text-[10px] text-cyan-500 font-mono tracking-widest">{user?.company.toUpperCase()}</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col text-right">
            <span className="text-xs font-bold text-white">{user?.email}</span>
            <span className="text-[10px] text-slate-400 font-mono uppercase">Rol: <span className="text-cyan-400">{user?.role.toUpperCase()}</span></span>
          </div>
          {user?.role !== 'superadmin' && (
            <div className="bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] px-2.5 py-1 rounded-md font-bold uppercase tracking-wider">
              Prueba: {user?.diasRestantes !== undefined ? `${user.diasRestantes} días` : '30 días'}
            </div>
          )}
          <button onClick={handleLogout} className="bg-slate-800 border border-slate-700 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-red-500/20 hover:border-red-500/50 transition-all">
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {user?.role === 'superadmin' ? (
        <div className="flex-1 flex flex-col overflow-hidden animate-fade-in relative">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-900 to-slate-900 pointer-events-none z-0"></div>
          
          <div className="bg-slate-800 border-b border-slate-700 px-4 py-3 flex gap-4 shadow-sm z-10 shrink-0">
            <div className="flex items-center gap-2">
              <ShieldCheck className="text-cyan-400" size={18}/>
              <span className="text-xs font-bold uppercase tracking-widest text-white">Consola Central CEO</span>
            </div>
          </div>
          
          <main className="flex-1 p-6 overflow-y-auto space-y-6 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-lg border-l-4 border-l-cyan-500">
                <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">MRR Total Estimado</span>
                <span className="text-3xl font-bold text-white">Q {mrrAcumulado.toLocaleString('es-GT', {minimumFractionDigits: 2})}</span>
                <span className="block text-[10px] text-slate-500 mt-2">Calculado en base a clientes activos.</span>
              </div>
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-lg border-l-4 border-l-blue-500">
                <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">Empresas Registradas</span>
                <span className="text-3xl font-bold text-white">{clientesAdmin.length}</span>
                <span className="block text-[10px] text-slate-500 mt-2">Clientes en Base de Datos.</span>
              </div>
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-lg border-l-4 border-l-purple-500">
                <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">Soporte Técnico Activo</span>
                <span className="text-lg font-bold text-purple-400 flex items-center gap-1 mt-2">
                  <MessageCircle size={18}/> WhatsApp Directo
                </span>
                <span className="block text-[10px] text-slate-500 mt-2">Canal de atención preferente.</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-slate-800 rounded-xl border border-slate-700 shadow-lg overflow-hidden flex flex-col min-h-[400px]">
                <div className="p-4 border-b border-slate-700 bg-slate-900/50 flex justify-between items-center">
                  <h3 className="text-xs uppercase font-bold text-white tracking-widest">Directorio de Clientes</h3>
                </div>
                <div className="flex-1 overflow-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-900/80 border-b border-slate-700 text-[10px] uppercase tracking-widest text-slate-400">
                        <th className="px-4 py-3 font-bold">Empresa / Contacto</th>
                        <th className="px-4 py-3 font-bold text-center">Plan</th>
                        <th className="px-4 py-3 font-bold text-center">Prueba</th>
                        <th className="px-4 py-3 font-bold text-center">Estado</th>
                        <th className="px-4 py-3 font-bold text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm divide-y divide-slate-700/50">
                      {clientesAdmin.map(c => (
                        <tr key={c.id} className="hover:bg-slate-700/30 transition-colors">
                          <td className="px-4 py-3">
                            <p className="font-bold text-white">{c.company}</p>
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">{c.email} | Tel: {c.telefono}</p>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="text-[9px] bg-slate-700 border border-slate-600 px-2 py-0.5 rounded-full font-bold uppercase text-slate-300 tracking-wider">
                              {c.plan}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center font-bold text-slate-300 font-mono text-xs">
                            {c.diasRestantes} días
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded border inline-block tracking-wider ${c.estado === 'activo' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                              {c.estado}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex justify-center gap-2">
                              <button onClick={() => extenderSuscripcion(c.id)} className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-2.5 py-1 rounded text-xs font-bold hover:bg-cyan-500/20 transition-colors">
                                +30 días
                              </button>
                              <button onClick={() => alternarEstadoCliente(c.id)} className={`px-2.5 py-1 rounded text-xs font-bold border transition-colors ${c.estado === 'activo' ? 'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'}`}>
                                {c.estado === 'activo' ? 'Bloquear' : 'Activar'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-lg p-5">
                  <h3 className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-4 flex items-center gap-2">
                    <Calendar size={14} className="text-cyan-400"/> Calendario de Cobros
                  </h3>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                    {clientesAdmin.map(c => {
                      const diaPago = c.fechaRegistro ? c.fechaRegistro.split('-')[2] : '01';
                      return (
                        <div key={c.id} className="flex justify-between items-center text-xs p-3 bg-slate-900/50 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors">
                          <div>
                            <p className="font-bold text-white">{c.company}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">Día {diaPago} de cada mes</p>
                          </div>
                          <span className="font-bold text-emerald-400 font-mono">Q{c.plan === 'emprendedor' ? '99' : (c.plan === 'pyme' ? '249' : '599')}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-lg p-5">
                  <h3 className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-4 flex items-center gap-2">
                    <PenTool size={14} className="text-cyan-400"/> Notas Privadas CEO
                  </h3>
                  <form onSubmit={handleAddNotaAdmin} className="flex gap-2 mb-4">
                    <input type="text" required placeholder="Anotación importante..." value={nuevaNota} onChange={e => setNuevaNota(e.target.value)} className="flex-1 px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-xs text-white outline-none focus:border-cyan-500 transition-colors" />
                    <button type="submit" className="bg-cyan-500 text-slate-900 px-3 rounded-lg font-bold hover:bg-cyan-400 transition-colors">
                      <Plus size={14}/>
                    </button>
                  </form>
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {notasAdmin.map(n => (
                      <div key={n.id} className="flex justify-between items-start text-xs p-3 bg-amber-500/5 rounded-lg border border-amber-500/20">
                        <p className="flex-1 pr-3 text-slate-300 leading-relaxed font-light">{n.nota}</p>
                        <button onClick={() => eliminarNotaAdmin(n.id)} className="text-slate-500 hover:text-red-400 transition-colors mt-0.5">
                          <Trash2 size={12}/>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      ) : (
        <>
          {/* NAVEGACIÓN DE TABS (CLIENTES) */}
          <div className="bg-slate-950 border-b border-slate-800 px-2 md:px-4 flex gap-1 md:gap-4 shadow-sm z-10 overflow-x-auto shrink-0 print:hidden relative">
            {[
              { id: 'pos', icon: Store, label: 'POS' },
              { id: 'rutas', icon: MapIcon, label: 'Despacho' },
              { id: 'stock', icon: Package, label: 'Almacén' },
              { id: 'historial', icon: History, label: 'Historial' },
              { id: 'finanzas', icon: Calculator, label: 'Finanzas' },
              { id: 'calendario', icon: Calendar, label: 'Agenda' },
              { id: 'perfil', icon: User, label: 'Ajustes' }
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`py-3 px-3 md:px-4 border-b-2 font-bold text-[10px] md:text-xs uppercase tracking-widest flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === tab.id ? 'border-cyan-500 text-cyan-400 bg-cyan-500/10' : 'border-transparent text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}>
                <tab.icon size={14} /> {tab.label}
              </button>
            ))}
          </div>

          <main className="flex-1 p-4 md:p-6 overflow-y-auto relative z-0">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/10 via-slate-900 to-slate-900 pointer-events-none -z-10"></div>
            
            <div className="max-w-7xl mx-auto">

              {}
              {activeTab === 'pos' && (
                <div className="animate-fade-in space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-slate-700 pb-3 gap-4">
                    <h2 className="text-xl font-bold text-white tracking-tight">Punto de Venta (Mostrador)</h2>
                  </div>
                  {/* LAYOUT HORIZONTAL REQUERIDO (Form a la izq, Tabla a la der) */}
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    <div className="md:col-span-1 bg-slate-800 rounded-xl border border-slate-700 p-5 h-fit shadow-lg">
                      <h3 className="text-[10px] uppercase font-bold text-slate-400 mb-4 tracking-widest flex items-center gap-2"><ShoppingCart size={14}/> Nueva Venta Rápida</h3>
                      <form onSubmit={handleAddVentaPOS} className="space-y-4">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Cliente (Opcional)</label>
                          <input type="text" value={formPOS.cliente} onChange={e => setFormPOS({...formPOS, cliente: e.target.value})} className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-sm text-white focus:border-cyan-500 outline-none transition-colors" />
                        </div>
                        <div className="flex gap-3">
                          <div className="flex-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">SKU / Item</label>
                            <select required value={formPOS.productoId} onChange={handleProductoPOSChange} className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-sm text-white focus:border-cyan-500 outline-none transition-colors appearance-none">
                              <option value="" disabled className="bg-slate-900">Seleccione...</option>
                              {inventario.map(p => <option key={p.id} value={p.id} className="bg-slate-900">{p.nombre} (Disp: {p.cantidad})</option>)}
                              <option value="custom" className="font-bold text-cyan-400 bg-slate-900">Excepción Comercial</option>
                            </select>
                          </div>
                          <div className="w-16 shrink-0">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Cant.</label>
                            <input type="number" required min="1" value={formPOS.cantidad} onChange={handleCantidadPOSChange} className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-sm text-center text-white focus:border-cyan-500 outline-none transition-colors" />
                          </div>
                        </div>
                        {formPOS.productoId === 'custom' && (
                          <input type="text" required placeholder="Detalle de excepción..." value={formPOS.customPedido} onChange={e => setFormPOS({...formPOS, customPedido: e.target.value})} className="w-full px-3 py-2 border border-amber-500/30 bg-amber-500/10 rounded-lg text-sm text-amber-200 focus:border-amber-500 outline-none" />
                        )}
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Método de Pago</label>
                          <select required value={formPOS.metodoPago} onChange={e => setFormPOS({...formPOS, metodoPago: e.target.value})} className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-sm text-white focus:border-cyan-500 outline-none transition-colors appearance-none">
                            <option value="efectivo" className="bg-slate-900">Efectivo</option>
                            <option value="tarjeta" className="bg-slate-900">Tarjeta</option>
                            <option value="transferencia" className="bg-slate-900">Transferencia</option>
                          </select>
                        </div>
                        <div className="pt-2">
                          <label className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1.5 block">Total Cobrado (Q)</label>
                          <input type="number" min="0" step="0.01" required value={formPOS.total} onChange={e => setFormPOS({...formPOS, total: e.target.value})} className="w-full px-3 py-2.5 border border-emerald-500/50 bg-emerald-500/10 rounded-lg font-bold text-emerald-300 text-lg focus:border-emerald-400 outline-none shadow-inner" />
                        </div>
                        <button type="submit" className="w-full bg-cyan-500 text-slate-900 font-bold uppercase text-xs tracking-widest py-3 rounded-lg hover:bg-cyan-400 transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] mt-2 flex justify-center items-center gap-2">
                          Completar Venta <ArrowRight size={14}/>
                        </button>
                      </form>
                    </div>
                    
                    <div className="md:col-span-2 lg:col-span-3 bg-slate-800 rounded-xl border border-slate-700 shadow-lg flex flex-col min-h-[400px] overflow-hidden">
                      <div className="flex justify-between items-center p-4 border-b border-slate-700 bg-slate-900/50">
                        <h3 className="text-xs uppercase font-bold text-white tracking-widest">Últimas Ventas Directas</h3>
                      </div>
                      <div className="flex-1 overflow-auto">
                        <table className="w-full text-left border-collapse min-w-[600px]">
                          <thead>
                            <tr className="bg-slate-900/80 border-b border-slate-700 text-[10px] uppercase tracking-widest text-slate-400">
                              <th className="px-4 py-3 font-bold">Fecha / Ref</th>
                              <th className="px-4 py-3 font-bold">Cliente</th>
                              <th className="px-4 py-3 font-bold">Ítems</th>
                              <th className="px-4 py-3 font-bold text-right">Importe</th>
                              <th className="px-4 py-3 font-bold text-center">Método</th>
                            </tr>
                          </thead>
                          <tbody className="text-sm divide-y divide-slate-700/50">
                            {entregas.filter(e => e.tipoEnvio === 'mostrador').length === 0 ? (
                              <tr>
                                <td colSpan="5" className="p-12 text-center text-slate-500 text-[10px] uppercase font-bold tracking-widest">Aún no hay ventas registradas hoy.</td>
                              </tr>
                            ) : (
                              [...entregas].filter(e => e.tipoEnvio === 'mostrador').reverse().map((e) => (
                                <tr key={e.id} className="hover:bg-slate-700/30 transition-colors text-slate-300">
                                  <td className="px-4 py-3 font-mono text-[10px] text-slate-400">{e.fechaCorta}</td>
                                  <td className="px-4 py-3 font-bold text-white">{e.cliente}</td>
                                  <td className="px-4 py-3 text-xs"><span className="font-bold text-white">{e.cantidad}x</span> {e.pedido}</td>
                                  <td className="px-4 py-3 text-right font-bold text-emerald-400 font-mono">Q{e.total.toFixed(2)}</td>
                                  <td className="px-4 py-3 text-center">
                                    <span className={"text-[9px] px-2 py-0.5 rounded border inline-block font-bold uppercase tracking-wider " + (e.metodoPago==='efectivo'?'bg-emerald-500/10 text-emerald-400 border-emerald-500/20':e.metodoPago==='tarjeta'?'bg-purple-500/10 text-purple-400 border-purple-500/20':'bg-blue-500/10 text-blue-400 border-blue-500/20')}>
                                      {e.metodoPago}
                                    </span>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {}
              {activeTab === 'rutas' && (
                <div className="animate-fade-in space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-slate-700 pb-3 gap-4">
                    <h2 className="text-xl font-bold text-white tracking-tight">Centro de Despacho</h2>
                    <div className="flex gap-2">
                      <button onClick={enviarLinkPiloto} className="bg-slate-800 text-white border border-slate-600 px-3 py-1.5 rounded-lg text-[10px] uppercase font-bold tracking-widest hover:bg-slate-700 transition-all flex items-center gap-2">
                        <MessageCircle size={14} className="text-emerald-400"/> Enviar a WhatsApp
                      </button>
                      <button onClick={() => setShowDriverView(true)} className="bg-cyan-500 text-slate-900 px-3 py-1.5 rounded-lg text-[10px] uppercase font-bold tracking-widest hover:bg-cyan-400 transition-all flex items-center gap-2 shadow-[0_0_10px_rgba(6,182,212,0.3)]">
                        <Smartphone size={14} /> Vista Piloto
                      </button>
                    </div>
                  </div>
                  {/* LAYOUT HORIZONTAL */}
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    <div className="md:col-span-1 bg-slate-800 rounded-xl border border-slate-700 p-5 h-fit shadow-lg">
                      <h3 className="text-[10px] uppercase font-bold text-slate-400 mb-4 tracking-widest flex items-center gap-2"><MapIcon size={14}/> Orden de Salida</h3>
                      <form onSubmit={handleAddRuta} className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Cliente</label>
                            <input type="text" required value={formRuta.cliente} onChange={e => setFormRuta({...formRuta, cliente: e.target.value})} className="w-full px-2.5 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-xs text-white focus:border-cyan-500 outline-none" />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Tel. (Opc)</label>
                            <input type="tel" value={formRuta.telefono} onChange={e => setFormRuta({...formRuta, telefono: e.target.value})} className="w-full px-2.5 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-xs text-white focus:border-cyan-500 outline-none" />
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Dirección / Destino</label>
                          <input type="text" required value={formRuta.direccion} onChange={e => setFormRuta({...formRuta, direccion: e.target.value})} className="w-full px-2.5 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-xs text-white focus:border-cyan-500 outline-none" />
                        </div>
                        <div className="flex gap-3">
                          <div className="flex-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">SKU / Item</label>
                            <select required value={formRuta.productoId} onChange={handleProductoChange} className="w-full px-2.5 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-xs text-white focus:border-cyan-500 outline-none appearance-none">
                              <option value="" disabled className="bg-slate-900">Seleccione...</option>
                              {inventario.map(p => <option key={p.id} value={p.id} className="bg-slate-900">{p.nombre} ({p.cantidad})</option>)}
                              <option value="custom" className="font-bold text-cyan-400 bg-slate-900">Excepción</option>
                            </select>
                          </div>
                          <div className="w-14 shrink-0">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Cant.</label>
                            <input type="number" required min="1" value={formRuta.cantidad} onChange={handleCantidadChange} className="w-full px-2.5 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-xs text-center text-white focus:border-cyan-500 outline-none" />
                          </div>
                        </div>
                        {formRuta.productoId === 'custom' && (
                          <input type="text" required placeholder="Detalle..." value={formRuta.customPedido} onChange={e => setFormRuta({...formRuta, customPedido: e.target.value})} className="w-full px-2.5 py-2 border border-amber-500/30 bg-amber-500/10 rounded-lg text-xs text-amber-200 outline-none" />
                        )}
                        <div className="pt-3 border-t border-slate-700">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Agente Asignado</label>
                          <div className="flex gap-2">
                            <select value={formRuta.tipoEnvio} onChange={e => setFormRuta({...formRuta, tipoEnvio: e.target.value})} className="w-1/3 px-2 py-2 bg-slate-950/80 border border-slate-600 rounded-lg text-[10px] text-slate-300 font-bold focus:border-cyan-500 outline-none appearance-none">
                              <option value="propio" className="bg-slate-900">Flota Int.</option>
                              <option value="mensajeria" className="bg-slate-900">Externa</option>
                            </select>
                            <input type="text" required placeholder="Nombre Piloto" value={formRuta.responsable} onChange={e => setFormRuta({...formRuta, responsable: e.target.value})} className="flex-1 px-2.5 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-xs text-white focus:border-cyan-500 outline-none" />
                          </div>
                        </div>
                        <div className="pt-2">
                          <label className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1.5 block">Importe a Cobrar (Q)</label>
                          <input type="number" min="0" step="0.01" required value={formRuta.total} onChange={e => setFormRuta({...formRuta, total: e.target.value})} className="w-full px-3 py-2.5 border border-emerald-500/50 bg-emerald-500/10 rounded-lg font-bold text-emerald-300 text-lg focus:border-emerald-400 outline-none shadow-inner" />
                        </div>
                        <button type="submit" className="w-full bg-cyan-500 text-slate-900 font-bold uppercase text-[11px] tracking-widest py-3 rounded-lg hover:bg-cyan-400 transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] mt-2 flex justify-center items-center gap-2">
                          <Plus size={14}/> Emitir Orden
                        </button>
                      </form>
                    </div>

                    <div className="md:col-span-2 lg:col-span-3 bg-slate-800 rounded-xl border border-slate-700 shadow-lg flex flex-col min-h-[400px] overflow-hidden">
                      <div className="flex justify-between items-center p-4 border-b border-slate-700 bg-slate-900/50">
                        <h3 className="text-xs uppercase font-bold text-white tracking-widest flex items-center gap-2">
                          Monitor de Ruteo 
                          <span className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded-full text-[10px]">{entregas.filter(e=>e.tipoEnvio!=='mostrador').length}</span>
                        </h3>
                        <button onClick={optimizarRuta} disabled={entregas.filter(e=>e.tipoEnvio!=='mostrador').length < 2} className="bg-slate-800 text-slate-300 border border-slate-600 px-3 py-1.5 rounded-lg text-[10px] uppercase font-bold tracking-widest disabled:opacity-30 hover:bg-slate-700 hover:text-white transition-all flex items-center gap-2">
                          <Zap size={12} className="text-amber-400"/> Optimizar AI
                        </button>
                      </div>
                      <div className="flex-1 overflow-auto">
                        <table className="w-full text-left border-collapse min-w-[600px]">
                          <thead>
                            <tr className="bg-slate-900/80 border-b border-slate-700 text-[10px] uppercase tracking-widest text-slate-400">
                              <th className="px-4 py-3 font-bold">Destino / Cliente</th>
                              <th className="px-4 py-3 font-bold">Ítems</th>
                              <th className="px-4 py-3 font-bold text-right">Importe</th>
                              <th className="px-4 py-3 font-bold">Agente</th>
                              <th className="px-4 py-3 font-bold text-center">Status</th>
                              <th className="px-4 py-3 font-bold text-center">Ctrl</th>
                            </tr>
                          </thead>
                          <tbody className="text-sm divide-y divide-slate-700/50">
                            {entregas.filter(e=>e.tipoEnvio!=='mostrador').length === 0 ? (
                              <tr>
                                <td colSpan="6" className="p-12 text-center text-slate-500 text-[10px] uppercase font-bold tracking-widest">Cola de despacho vacía.</td>
                              </tr>
                            ) : (
                              entregas.filter(e=>e.tipoEnvio!=='mostrador').map((e) => {
                                const isEnt = e.estado === 'entregado';
                                return (
                                  <tr key={e.id} className={`transition-colors text-slate-300 ${isEnt ? 'bg-slate-900/40 opacity-50' : 'hover:bg-slate-700/30'}`}>
                                    <td className="px-4 py-3">
                                      <p className={`font-bold text-white ${isEnt ? 'line-through text-slate-500' : ''}`}>{e.direccion}</p>
                                      <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[10px] text-slate-400">{e.cliente}</span>
                                        {e.telefono && !isEnt && (
                                          <button onClick={()=>notificarClienteFinal(e)} className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider flex items-center gap-1 hover:bg-emerald-500/20 transition-colors">
                                            <MessageCircle size={10}/> SMS
                                          </button>
                                        )}
                                      </div>
                                    </td>
                                    <td className="px-4 py-3 text-xs"><span className="font-bold text-white">{e.cantidad}x</span> {e.pedido}</td>
                                    <td className="px-4 py-3 text-right font-bold text-emerald-400 font-mono">Q{e.total.toFixed(2)}</td>
                                    <td className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider"><span className="bg-slate-800 px-2 py-1 rounded text-slate-300 border border-slate-600">{e.responsable.slice(0,10)}</span></td>
                                    <td className="px-4 py-3 text-center">
                                      <span className={`text-[9px] px-2 py-0.5 rounded border inline-block font-bold uppercase tracking-wider ${isEnt ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                                        {isEnt ? 'Entregado' : 'Pendiente'}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                      <button onClick={() => eliminarRuta(e.id)} className="text-slate-500 hover:text-red-400 transition-colors">
                                        <Trash2 size={14}/>
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {}
              {activeTab === 'stock' && (
                <div className="animate-fade-in space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-700 pb-3 gap-4">
                    <h2 className="text-xl font-bold text-white tracking-tight">Gestor de Almacén (WMS)</h2>
                    <div className="flex items-center gap-4">
                      <label className="cursor-pointer bg-slate-800 text-white border border-slate-600 px-4 py-2 rounded-lg text-[10px] uppercase font-bold tracking-widest hover:bg-slate-700 transition-all flex items-center gap-2">
                        <Download size={14} className="text-cyan-400"/> CSV Import
                        <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
                      </label>
                      <div className="text-right bg-slate-800 px-4 py-1.5 rounded-lg border border-slate-700">
                        <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-widest">Valorización Neta</span>
                        <span className="font-bold text-cyan-400 text-sm font-mono">Q {valorTotalInventario.toLocaleString('es-GT', {minimumFractionDigits: 2})}</span>
                      </div>
                    </div>
                  </div>
                  {/* LAYOUT HORIZONTAL */}
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    <div className="md:col-span-1 bg-slate-800 rounded-xl border border-slate-700 p-5 shadow-lg h-fit">
                      <h3 className="text-[10px] uppercase font-bold text-slate-400 mb-4 tracking-widest flex items-center gap-2"><Package size={14}/> Alta de SKU</h3>
                      <form onSubmit={handleAddStock} className="space-y-4">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Descripción</label>
                          <input type="text" required value={formStock.nombre} onChange={e=>setFormStock({...formStock, nombre: e.target.value})} className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-xs text-white focus:border-cyan-500 outline-none" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Volumen</label>
                            <input type="number" required min="0" value={formStock.cantidad} onChange={e=>setFormStock({...formStock, cantidad: e.target.value})} className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-xs text-center text-white focus:border-cyan-500 outline-none" />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Tarifa (Q)</label>
                            <input type="number" required min="0" step="0.01" value={formStock.precio} onChange={e=>setFormStock({...formStock, precio: e.target.value})} className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-xs text-center text-white focus:border-cyan-500 outline-none" />
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-1.5 block">Umbral Crítico (Mín)</label>
                          <input type="number" required min="0" value={formStock.minimo} onChange={e=>setFormStock({...formStock, minimo: e.target.value})} className="w-full px-3 py-2 border border-amber-500/30 bg-amber-500/5 rounded-lg text-xs text-center text-amber-100 focus:border-amber-400 outline-none" />
                        </div>
                        <button type="submit" className="w-full bg-cyan-500 text-slate-900 font-bold uppercase text-[11px] tracking-widest py-3 rounded-lg hover:bg-cyan-400 transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] mt-2 flex justify-center items-center gap-2">
                          Registrar SKU
                        </button>
                      </form>
                    </div>
                    
                    <div className="md:col-span-2 lg:col-span-3 bg-slate-800 rounded-xl border border-slate-700 shadow-lg overflow-hidden flex flex-col">
                      <div className="overflow-x-auto flex-1">
                        <table className="w-full text-left border-collapse">
                          <thead className="bg-slate-900/80 border-b border-slate-700 text-[10px] uppercase tracking-widest text-slate-400">
                            <tr>
                              <th className="px-5 py-4 font-bold">Identificador / Artículo</th>
                              <th className="px-5 py-4 font-bold text-center">Existencias</th>
                              <th className="px-5 py-4 font-bold text-right">Unitario</th>
                              <th className="px-5 py-4 font-bold text-center">Diagnóstico</th>
                              <th className="px-5 py-4 font-bold text-center">Ctrl</th>
                            </tr>
                          </thead>
                          <tbody className="text-sm divide-y divide-slate-700/50 text-slate-300">
                            {inventario.map(p => {
                              const alerta = p.cantidad <= p.minimo && p.cantidad > 0; 
                              const critico = p.cantidad === 0;
                              return (
                                <tr key={p.id} className="hover:bg-slate-700/30 transition-colors">
                                  <td className="px-5 py-3">
                                    <p className="font-bold text-white">{p.nombre}</p>
                                    <p className="text-[9px] text-slate-500 font-mono tracking-widest mt-0.5">{p.id}</p>
                                  </td>
                                  <td className="px-5 py-3 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                      <button onClick={()=>modificarStock(p.id, -1)} className="w-6 h-6 rounded-md border border-slate-600 bg-slate-900/50 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white font-bold transition-colors">-</button>
                                      <span className="font-bold font-mono w-10 text-center text-white">{p.cantidad}</span>
                                      <button onClick={()=>modificarStock(p.id, 1)} className="w-6 h-6 rounded-md border border-slate-600 bg-slate-900/50 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white font-bold transition-colors">+</button>
                                    </div>
                                  </td>
                                  <td className="px-5 py-3 text-right font-mono font-bold text-emerald-400">Q{p.precio.toFixed(2)}</td>
                                  <td className="px-5 py-3 text-center">
                                    {critico ? (
                                      <span className="text-[9px] uppercase font-bold px-2 py-1 rounded-md border bg-red-500/10 text-red-400 border-red-500/30 tracking-widest">Ruptura</span>
                                    ) : alerta ? (
                                      <span className="text-[9px] uppercase font-bold px-2 py-1 rounded-md border bg-amber-500/10 text-amber-400 border-amber-500/30 tracking-widest">Reabastecer</span>
                                    ) : (
                                      <span className="text-[9px] uppercase font-bold px-2 py-1 rounded-md border bg-emerald-500/10 text-emerald-400 border-emerald-500/30 tracking-widest">Óptimo</span>
                                    )}
                                  </td>
                                  <td className="px-5 py-3 text-center">
                                    <button onClick={()=>eliminarProducto(p.id)} className="text-slate-500 hover:text-red-400 transition-colors">
                                      <Trash2 size={16}/>
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {}
              {activeTab === 'historial' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-slate-700 pb-3 gap-4">
                    <h2 className="text-xl font-bold text-white tracking-tight">Historial y Auditoría de POD</h2>
                    <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 shadow-lg">
                      <Filter size={14} className="text-cyan-400" />
                      <select value={filtroHistorial} onChange={e => setFiltroHistorial(e.target.value)} className="text-[10px] md:text-xs font-bold text-white uppercase tracking-widest bg-transparent outline-none cursor-pointer appearance-none">
                        <option value="todos" className="bg-slate-900">Histórico Completo</option>
                        <option value="hoy" className="bg-slate-900">Solo Hoy</option>
                        <option value="7dias" className="bg-slate-900">Últimos 7 días</option>
                        <option value="1mes" className="bg-slate-900">Último mes</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-lg overflow-hidden flex flex-col">
                    <div className="overflow-x-auto flex-1">
                      <table className="w-full text-left border-collapse min-w-[900px]">
                        <thead>
                          <tr className="bg-slate-900/80 border-b border-slate-700 text-[10px] uppercase tracking-widest text-slate-400">
                            <th className="px-5 py-4 font-bold">Fecha / Ref</th>
                            <th className="px-5 py-4 font-bold">Cliente y Destino</th>
                            <th className="px-5 py-4 font-bold">Pedido / Total</th>
                            <th className="px-5 py-4 font-bold">Cobro</th>
                            <th className="px-5 py-4 font-bold">Prueba Entrega (POD)</th>
                            <th className="px-5 py-4 font-bold text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50 text-sm text-slate-300">
                          {entregasHistorial.length === 0 ? (
                            <tr>
                              <td colSpan="6" className="p-12 text-center text-slate-500 text-[10px] font-bold uppercase tracking-widest">Registros no encontrados.</td>
                            </tr>
                          ) : (
                            [...entregasHistorial].reverse().map(e => (
                              <tr key={e.id} className="hover:bg-slate-700/30 transition-colors">
                                <td className="px-5 py-4">
                                  <p className="text-[10px] text-slate-400 font-mono mb-1">{e.fechaCorta}</p>
                                  <span className="text-[9px] bg-slate-700 border border-slate-600 px-2 py-0.5 rounded font-bold uppercase tracking-wider text-slate-300">{e.responsable.slice(0,8)}</span>
                                </td>
                                <td className="px-5 py-4">
                                  <p className="font-bold text-white">{e.cliente}</p>
                                  <p className="text-[10px] text-slate-500 mt-0.5">{e.direccion}</p>
                                </td>
                                <td className="px-5 py-4">
                                  <p className="font-medium text-slate-300 text-xs mb-0.5"><span className="text-white font-bold">{e.cantidad}x</span> {e.pedido}</p>
                                  <p className="font-bold text-emerald-400 font-mono text-xs">Q {e.total.toFixed(2)}</p>
                                </td>
                                <td className="px-5 py-4 text-xs">
                                  {e.estado === 'entregado' ? (
                                    <span className={"px-2.5 py-1 rounded-md font-bold uppercase tracking-wider text-[9px] border " + (e.metodoPago==='efectivo'?'bg-emerald-500/10 text-emerald-400 border-emerald-500/30':e.metodoPago==='tarjeta'?'bg-purple-500/10 text-purple-400 border-purple-500/30':'bg-blue-500/10 text-blue-400 border-blue-500/30')}>
                                      {e.metodoPago}
                                    </span>
                                  ) : (
                                    <span className="text-slate-600">-</span>
                                  )}
                                </td>
                                <td className="px-5 py-4 text-xs text-cyan-200/70 font-mono italic">
                                  {e.estado === 'entregado' ? e.firma : '-'}
                                </td>
                                <td className="px-5 py-4 text-center">
                                  <span className={"text-[9px] uppercase font-bold px-2.5 py-1 rounded-md border tracking-wider " + (e.estado==='entregado'?'bg-emerald-500/10 text-emerald-400 border-emerald-500/30':'bg-amber-500/10 text-amber-400 border-amber-500/30')}>
                                    {e.estado}
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {}
              {activeTab === 'finanzas' && (
                <div className="animate-fade-in space-y-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-slate-700 pb-3 gap-4">
                    <h2 className="text-xl font-bold text-white tracking-tight">Centro de Control Financiero</h2>
                    <div className="flex flex-wrap items-center gap-3">
                      <button onClick={() => setShowPDF(true)} className="bg-slate-800 text-white border border-slate-600 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-slate-700 transition-all flex items-center gap-2">
                        <FileText size={14} className="text-cyan-400"/> Emitir PDF
                      </button>
                      <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 shadow-lg">
                        <Filter size={14} className="text-cyan-400" />
                        <select value={filtroFinanzas} onChange={e => setFiltroFinanzas(e.target.value)} className="text-[10px] font-bold text-white uppercase tracking-widest bg-transparent outline-none cursor-pointer appearance-none">
                          <option value="todos" className="bg-slate-900">Histórico Total</option>
                          <option value="hoy" className="bg-slate-900">Hoy</option>
                          <option value="7dias" className="bg-slate-900">7 Días</option>
                          <option value="1mes" className="bg-slate-900">Último Mes</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                    <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-lg border-l-4 border-l-cyan-500 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-cyan-500/10 rounded-bl-full blur-xl group-hover:bg-cyan-500/20 transition-all"></div>
                      <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1.5 relative z-10">Ingresos Brutos</span>
                      <span className="text-2xl font-bold text-white relative z-10 font-mono">Q {ingresosPagados.toLocaleString('es-GT', {minimumFractionDigits:2})}</span>
                    </div>
                    <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-lg border-l-4 border-l-amber-500 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/10 rounded-bl-full blur-xl group-hover:bg-amber-500/20 transition-all"></div>
                      <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1.5 relative z-10">Cuentas por Cobrar</span>
                      <span className="text-2xl font-bold text-amber-400 relative z-10 font-mono">Q {cuentasPorCobrar.toLocaleString('es-GT', {minimumFractionDigits:2})}</span>
                    </div>
                    <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-lg border-l-4 border-l-red-500 flex justify-between items-end relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/10 rounded-bl-full blur-xl group-hover:bg-red-500/20 transition-all"></div>
                      <div className="relative z-10">
                        <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1.5">Gastos (OPEX)</span>
                        <span className="text-2xl font-bold text-red-400 font-mono">Q {totalGastosOperativos.toLocaleString('es-GT', {minimumFractionDigits:2})}</span>
                      </div>
                      <span className="text-[10px] font-bold text-red-300 bg-red-500/20 px-1.5 py-0.5 rounded-md relative z-10 border border-red-500/30">{margenGastos.toFixed(1)}%</span>
                    </div>
                    <div className="bg-gradient-to-br from-cyan-900/40 to-slate-800 border border-cyan-500/30 rounded-xl p-5 shadow-[0_0_20px_rgba(6,182,212,0.15)] border-l-4 border-l-emerald-400 flex justify-between items-end relative overflow-hidden">
                      <div className="relative z-10">
                        <span className="block text-[10px] uppercase font-bold text-cyan-200 tracking-widest mb-1.5">Utilidad Neta</span>
                        <span className="text-2xl font-bold text-emerald-400 font-mono drop-shadow-[0_0_10px_rgba(52,211,153,0.3)]">Q {utilidadNeta.toLocaleString('es-GT', {minimumFractionDigits:2})}</span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/20 px-1.5 py-0.5 rounded-md relative z-10 border border-emerald-500/30 shadow-sm">{margenUtilidad.toFixed(1)}%</span>
                    </div>
                  </div>

                  <div className="bg-slate-800 text-white rounded-xl shadow-lg border border-slate-700 p-5">
                    <h3 className="text-[10px] uppercase font-bold tracking-widest mb-4 flex items-center gap-2 text-slate-400">
                      <Wallet size={16} className="text-emerald-400"/> Liquidación de Efectivo (Corte de Caja Diario)
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      {Object.keys(liquidacionPilotos).length === 0 ? (
                        <p className="text-xs text-slate-500">No hay efectivo pendiente en calle.</p>
                      ) : (
                        Object.keys(liquidacionPilotos).map(piloto => (
                          <div key={piloto} className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-white mb-2">{piloto}</p>
                            <div className="flex justify-between items-end">
                              <div>
                                <span className="block text-[9px] text-slate-500 uppercase tracking-widest">Efectivo</span>
                                <span className="font-bold text-emerald-400 text-sm font-mono">Q {liquidacionPilotos[piloto].efectivo.toFixed(2)}</span>
                              </div>
                              <div className="text-right">
                                <span className="block text-[9px] text-slate-500 uppercase tracking-widest">Digital</span>
                                <span className="font-mono text-slate-400 text-xs">Q {liquidacionPilotos[piloto].digital.toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-lg flex flex-col relative z-10">
                      <h3 className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-6">Comportamiento de Ingresos (Realizados)</h3>
                      
                      <div className="h-[350px] w-full flex items-center justify-center relative">
                        {chartData && chartData.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{top:10, right:10, left:0, bottom:0}}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155"/>
                              <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false}/>
                              <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v)=>'Q'+v}/>
                              <Tooltip cursor={{fill: '#0f172a'}} contentStyle={{backgroundColor: '#1e293b', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '12px'}} formatter={(v)=>'Q'+Number(v).toFixed(2)}/>
                              <Bar dataKey="amount" fill="#06b6d4" radius={[4,4,0,0]} barSize={40} />
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="flex flex-col items-center justify-center text-slate-500 bg-slate-900/50 w-full h-full rounded-xl border border-dashed border-slate-700">
                            <BarChart3 size={40} className="mb-3 opacity-30"/>
                            <p className="font-bold uppercase tracking-widest text-[10px]">Esperando datos de facturación.</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="lg:col-span-1 bg-slate-800 border border-slate-700 rounded-xl shadow-lg flex flex-col">
                      <div className="p-4 border-b border-slate-700 bg-slate-900/50">
                        <h3 className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Asentamiento OPEX</h3>
                      </div>
                      <div className="p-4 border-b border-slate-700">
                        <form onSubmit={handleAddGasto} className="flex gap-2">
                          <input type="text" required placeholder="Concepto" value={formGasto.descripcion} onChange={e=>setFormGasto({...formGasto, descripcion: e.target.value})} className="flex-1 px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-xs text-white focus:border-cyan-500 outline-none" />
                          <input type="number" required min="1" step="0.01" placeholder="Monto" value={formGasto.monto} onChange={e=>setFormGasto({...formGasto, monto: e.target.value})} className="w-20 px-2 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-xs text-white focus:border-cyan-500 outline-none text-right" />
                          <button type="submit" className="bg-cyan-500 text-slate-900 px-3 rounded-lg hover:bg-cyan-400 transition-colors">
                            <Plus size={14}/>
                          </button>
                        </form>
                      </div>
                      <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {gastosFinanzas.length === 0 ? (
                          <p className="text-center text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-8">Sin registros.</p>
                        ) : (
                          gastosFinanzas.map(g => (
                            <div key={g.id} className="flex justify-between items-center text-xs border-b border-slate-700 pb-2">
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-200">{g.descripcion}</span>
                                <span className="text-[9px] text-slate-500">{g.fecha}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="font-bold text-red-400 font-mono">-Q{g.monto.toFixed(2)}</span>
                                <button onClick={()=>eliminarGasto(g.id)} className="text-slate-500 hover:text-red-400 transition-colors"><Trash2 size={12}/></button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {}
              {activeTab === 'calendario' && (
                <div className="animate-fade-in space-y-4">
                  <div className="flex justify-between items-end border-b border-slate-700 pb-3">
                    <h2 className="text-xl font-bold text-white tracking-tight">Agenda Cronológica</h2>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1 bg-slate-800 rounded-xl border border-slate-700 p-5 shadow-lg h-fit">
                      <h3 className="text-[10px] uppercase font-bold text-slate-400 mb-4 tracking-widest"><Calendar size={14} className="inline mr-2"/> Ingreso de Evento</h3>
                      <form onSubmit={handleAddEvento} className="space-y-4">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Denominación</label>
                          <input type="text" required value={formEvento.titulo} onChange={e=>setFormEvento({...formEvento, titulo: e.target.value})} className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-sm text-white focus:border-cyan-500 outline-none" />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Fecha</label>
                          <input type="date" required value={formEvento.fecha} onChange={e=>setFormEvento({...formEvento, fecha: e.target.value})} className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-sm text-white focus:border-cyan-500 outline-none" style={{colorScheme: 'dark'}} />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Especificaciones</label>
                          <textarea rows="3" value={formEvento.detalles} onChange={e=>setFormEvento({...formEvento, detalles: e.target.value})} className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-sm text-white focus:border-cyan-500 outline-none resize-none" />
                        </div>
                        <button type="submit" className="w-full bg-cyan-500 text-slate-900 font-bold uppercase text-[11px] tracking-widest py-3 rounded-lg hover:bg-cyan-400 transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] mt-2">Agendar Evento</button>
                      </form>
                    </div>
                    <div className="lg:col-span-2 bg-slate-800 rounded-xl border border-slate-700 p-5 shadow-lg min-h-[400px]">
                      <h3 className="text-[10px] uppercase font-bold text-slate-400 mb-5 tracking-widest">Cronograma Activo</h3>
                      <div className="space-y-4">
                        {eventos.map(evt => { 
                          const esPasado = evt.fechaReal < new Date().setHours(0,0,0,0);
                          return (
                            <div key={evt.id} className={`rounded-xl p-4 flex justify-between items-start border transition-colors ${esPasado ? 'border-slate-700 bg-slate-900/40 opacity-50' : 'border-slate-600 bg-slate-900/20 border-l-4 border-l-cyan-500 shadow-md'}`}>
                              <div className="flex gap-4">
                                <div className="bg-slate-900/80 border border-slate-700 w-12 h-12 rounded-lg flex flex-col justify-center items-center shrink-0">
                                  <span className="text-[9px] font-bold uppercase text-cyan-400">{evt.mes}</span>
                                  <span className="text-base font-bold text-white leading-none">{evt.dia}</span>
                                </div>
                                <div>
                                  <h4 className="font-bold text-sm text-white">
                                    {evt.titulo} {esPasado && <span className="text-[8px] bg-slate-700 text-slate-400 px-2 py-0.5 rounded-full ml-2 uppercase tracking-widest">Ejecutado</span>}
                                  </h4>
                                  <p className="text-xs text-slate-400 mt-1">{evt.detalles}</p>
                                </div>
                              </div>
                              <button onClick={()=>eliminarEvento(evt.id)} className="text-slate-500 hover:text-red-400 transition-colors">
                                <Trash2 size={14}/>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {}
              {activeTab === 'perfil' && (
                <div className="max-w-2xl mx-auto animate-fade-in space-y-4">
                  <div className="flex justify-between items-end border-b border-slate-700 pb-3">
                    <h2 className="text-xl font-bold text-white tracking-tight">Parámetros del Sistema</h2>
                  </div>
                  <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-lg overflow-hidden">
                    <div className="p-5 border-b border-slate-700 bg-slate-900/50 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-slate-900 font-bold text-sm bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                        ADM
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-base">{user?.email}</h3>
                        <span className="text-[9px] px-2 py-0.5 rounded-full uppercase font-bold tracking-widest border bg-cyan-500/10 text-cyan-400 border-cyan-500/20 mt-1 inline-block">
                          Nivel: Master / Owner
                        </span>
                      </div>
                    </div>
                    <form onSubmit={handleUpdatePerfil} className="p-6 space-y-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Razón Social</label>
                          <input type="text" required value={formPerfil.company} onChange={e=>setFormPerfil({...formPerfil, company:e.target.value})} disabled={user?.role !== 'owner'} className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-sm text-white focus:border-cyan-500 outline-none disabled:opacity-50" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Identificador Principal</label>
                          <input type="email" required value={formPerfil.email} onChange={e=>setFormPerfil({...formPerfil, email:e.target.value})} disabled={user?.role !== 'owner'} className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-sm text-white focus:border-cyan-500 outline-none disabled:opacity-50" />
                        </div>
                      </div>
                      <div className="pt-5 border-t border-slate-700">
                        <h4 className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest mb-4">Auditoría de Credenciales</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Nueva Clave</label>
                            <input type="password" value={formPerfil.newPassword} onChange={e=>setFormPerfil({...formPerfil, newPassword:e.target.value})} disabled={user?.role !== 'owner'} className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-sm text-white focus:border-cyan-500 outline-none disabled:opacity-50" />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Verificar Clave</label>
                            <input type="password" value={formPerfil.confirmPassword} onChange={e=>setFormPerfil({...formPerfil, confirmPassword:e.target.value})} disabled={user.role !== 'owner'} className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-sm text-white focus:border-cyan-500 outline-none disabled:opacity-50" />
                          </div>
                        </div>
                      </div>
                      {user?.role === 'owner' && (
                        <button type="submit" className="w-full bg-cyan-500 text-slate-900 font-bold uppercase text-[11px] tracking-widest py-3 rounded-lg hover:bg-cyan-400 transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] mt-4">
                          Aplicar Políticas de Seguridad
                        </button>
                      )}
                    </form>
                  </div>
                </div>
              )}

            </div>
          </main>
        </>
      )}
      
      {}
      <div className="fixed top-4 right-4 flex flex-col gap-2 z-[9999]">
        {toasts.map(t => (
          <div key={t.id} className={`px-4 py-3 rounded-lg shadow-2xl text-white flex items-center gap-3 text-xs font-bold tracking-wide border ${t.type === 'error' ? 'bg-red-500/90 border-red-500/50' : t.type === 'info' ? 'bg-blue-500/90 border-blue-500/50' : 'bg-slate-800/90 backdrop-blur-md border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.2)]'}`}>
            {t.type === 'error' ? <AlertTriangle size={16} /> : t.type === 'info' ? <Info size={16} /> : <CheckCircle2 size={16} className="text-cyan-400"/>}
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
}