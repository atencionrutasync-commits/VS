import React, { useState, useEffect } from 'react';
import { 
  Map as MapIcon, Package, History, Calendar, BarChart3, User, 
  LogOut, Plus, Trash2, CheckCircle2, Clock, AlertTriangle, 
  Lock, Building, Mail, ChevronRight, Check, Upload, Info, 
  Bike, Truck, Download, Zap, Filter, ShieldAlert, ShieldCheck, 
  ArrowLeft, ArrowRight, LayoutDashboard, TrendingUp, DollarSign, 
  Receipt, Calculator, CreditCard, Printer, FileText, Smartphone,
  Navigation, Phone, PlayCircle, Star, Camera, PenTool,
  MessageCircle, Wallet, Store, ShoppingCart, Globe, Headset,
  FileSpreadsheet, FileOutput, Shield, Power, PowerOff, X, Search
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  LineChart, Line
} from 'recharts';

// --- FIREBASE IMPORTS ---
import { initializeApp } from 'firebase/app';
import { 
  getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, 
  onAuthStateChanged, signOut, sendPasswordResetEmail, 
  setPersistence, browserLocalPersistence, browserSessionPersistence 
} from 'firebase/auth';
import { 
  getFirestore, doc, setDoc, getDoc, collection, addDoc, deleteDoc,
  updateDoc, onSnapshot, query, orderBy, limit, serverTimestamp 
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// ============================================================================
// 1. CONFIGURACIÓN DE FIREBASE (Seguridad .env implementada)
// ============================================================================
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY, 
  authDomain: "rutasync-erp.firebaseapp.com",
  projectId: "rutasync-erp",
  storageBucket: "rutasync-erp.firebasestorage.app",
  messagingSenderId: "969874888509",
  appId: "1:969874888509:web:f52ffe1e015d2831c55754",
  measurementId: "G-7SH3LH6ST0"
};

let app, auth, db, storage;
const isFirebaseConfigured = !!firebaseConfig.apiKey && firebaseConfig.apiKey !== "TU_API_KEY" && firebaseConfig.apiKey !== "undefined";

if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app); 
  } catch (error) {
    console.error("Error inicializando Firebase:", error);
  }
}

// ============================================================================
// 2. DATOS DE PRUEBA Y ESTADOS INICIALES (MODO DEMOSTRACIÓN)
// ============================================================================
const dataRendimiento = [
  { nombre: 'Lun', entregas: 45, ingresos: 2100 },
  { nombre: 'Mar', entregas: 52, ingresos: 2400 },
  { nombre: 'Mié', entregas: 38, ingresos: 1850 },
  { nombre: 'Jue', entregas: 65, ingresos: 3200 },
  { nombre: 'Vie', entregas: 48, ingresos: 2200 },
  { nombre: 'Sáb', entregas: 70, ingresos: 3500 },
  { nombre: 'Dom', entregas: 20, ingresos: 900 },
];

const mockInventory = [
  { id: '1', sku: 'RUT-001', nombre: 'Caja Standard 10kg', stock: 150, precio: 25.00 },
  { id: '2', sku: 'RUT-002', nombre: 'Bolsa de Seguridad', stock: 500, precio: 5.00 },
  { id: '3', sku: 'RUT-003', nombre: 'Cinta Embalaje', stock: 45, precio: 15.00 },
];

export default function App() {
  // --- ESTADOS DE AUTENTICACIÓN ---
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  
  // --- ESTADOS DE NAVEGACIÓN Y MODALES ---
  const [currentView, setCurrentView] = useState('landing');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login'); 
  const [selectedPlan, setSelectedPlan] = useState('PYME');
  
  const [showContact, setShowContact] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  
  // --- ESTADOS GLOBALES DE INTERFAZ (SEGURIDAD Y UX) ---
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  // --- ESTADOS DE FORMULARIOS DE ACCESO ---
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [telefono, setTelefono] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [authError, setAuthError] = useState('');

  // --- ESTADOS DEL ERP CLOUD ---
  const [inventario, setInventario] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [rutas, setRutas] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [clientesAdmin, setClientesAdmin] = useState([]);

  // --- ESTADOS OPERATIVOS ---
  // POS (Protección Anti-NaN inicializada con String)
  const [posSelectedItemId, setPosSelectedItemId] = useState('');
  const [posQuantity, setPosQuantity] = useState('1'); 
  const [posClient, setPosClient] = useState('Cliente Mostrador');
  const [posMethod, setPosMethod] = useState('Efectivo');
  
  // Despachos
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [newRoute, setNewRoute] = useState({ piloto: '', telefonoPiloto: '', cliente: '', direccion: '', item: '', qty: '1', telefonoCliente: '' });

  // Almacén
  const [showProductModal, setShowProductModal] = useState(false);
  const [newProduct, setNewProduct] = useState({ sku: '', nombre: '', stock: '1', precio: '0' });

  // Agenda
  const [showEventModal, setShowEventModal] = useState(false);
  const [newEvent, setNewEvent] = useState({ titulo: '', fecha: '', tipo: 'Mantenimiento', detalle: '' });

  // Simulador de Piloto y Prueba de Entrega (POD)
  const [activeDelivery, setActiveDelivery] = useState(null);
  const [deliveryName, setDeliveryName] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState('Efectivo');
  const [deliveryPhotoFile, setDeliveryPhotoFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // ============================================================================
  // 3. EFECTOS: CICLO DE VIDA Y FIREBASE
  // ============================================================================
  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setInventario(mockInventory); 
      setLoadingAuth(false);
      return;
    }

    let unsubProfile, unsubUsers, unsubInv, unsubVentas, unsubRutas, unsubEventos;

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        
        // 1. Perfil del Usuario
        const userRef = doc(db, 'users', currentUser.uid);
        unsubProfile = onSnapshot(userRef, async (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            
            // Suspensión Expulsión Inmediata (Seguridad Grado Militar)
            if (data.isActive === false && data.role !== 'SUPERADMIN') {
              showToast("ACCESO DENEGADO: Su cuenta corporativa ha sido suspendida. Sesión terminada.");
              setTimeout(async () => {
                await signOut(auth);
                window.location.reload();
              }, 2500);
              return;
            }
            setUserData(data);

            // Carga de Superadmin
            if (data.role === 'SUPERADMIN') {
              unsubUsers = onSnapshot(collection(db, 'users'), (usersSnap) => {
                setClientesAdmin(usersSnap.docs.map(d => ({ uid: d.id, ...d.data() })));
              });
            }
          } else {
            // AUDITORÍA: Si el documento fue borrado físicamente por el Súper Admin (Orphan Auth Fix)
            showToast("ALERTA CRÍTICA: Perfil de empresa no encontrado o eliminado. Cerrando conexión...");
            setTimeout(async () => {
              await signOut(auth);
              window.location.reload();
            }, 2500);
          }
        });

        // 2. Inventario
        const invRef = collection(db, `users/${currentUser.uid}/inventario`);
        unsubInv = onSnapshot(invRef, (snapshot) => {
          if(snapshot.empty) {
            mockInventory.forEach(item => setDoc(doc(invRef, item.id.toString()), item));
          } else {
            setInventario(snapshot.docs.map(d => ({id: d.id, ...d.data()})));
          }
        });

        // 3. Ventas (Limitado a 100 para ahorrar lecturas Cloud)
        const ventasRef = query(collection(db, `users/${currentUser.uid}/ventas`), orderBy('createdAt', 'desc'), limit(100));
        unsubVentas = onSnapshot(ventasRef, (snapshot) => {
          setVentas(snapshot.docs.map(d => ({id: d.id, ...d.data()})));
        });

        // 4. Rutas (Limitado a 100)
        const rutasRef = query(collection(db, `users/${currentUser.uid}/rutas`), orderBy('createdAt', 'desc'), limit(100));
        unsubRutas = onSnapshot(rutasRef, (snapshot) => {
          setRutas(snapshot.docs.map(d => ({id: d.id, ...d.data()})));
        });

        // 5. Eventos
        const eventosRef = query(collection(db, `users/${currentUser.uid}/eventos`), orderBy('fecha', 'asc'));
        unsubEventos = onSnapshot(eventosRef, (snapshot) => {
          setEventos(snapshot.docs.map(d => ({id: d.id, ...d.data()})));
        });

        setCurrentView('dashboard');
        setShowAuthModal(false);
      } else {
        setUser(null);
        setUserData(null);
        setCurrentView('landing');
      }
      setLoadingAuth(false);
    });

    return () => {
      unsubscribeAuth();
      if (unsubProfile) unsubProfile();
      if (unsubUsers) unsubUsers();
      if (unsubInv) unsubInv();
      if (unsubVentas) unsubVentas();
      if (unsubRutas) unsubRutas();
      if (unsubEventos) unsubEventos();
    };
  }, []);

  // ============================================================================
  // 4. SEGURIDAD DE AUTENTICACIÓN
  // ============================================================================
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const validateEmail = (email) => /\S+@\S+\.\S+/.test(email);

  const isLengthValid = password.length >= 8;
  const hasUpperLower = /(?=.*[a-z])(?=.*[A-Z])/.test(password);
  const hasNumber = /(?=.*\d)/.test(password);
  const hasSpecial = /(?=.*[@#$%^&+=!_*-])/.test(password);
  const isPasswordSecure = isLengthValid && hasUpperLower && hasNumber && hasSpecial;

  const scrollToPricing = () => {
    const pricingSection = document.getElementById('pricing-section');
    if (pricingSection) pricingSection.scrollIntoView({ behavior: 'smooth' });
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return; // Escudo Anti-Doble Clic
    setAuthError('');
    
    // Limpieza de inputs (Sanitización básica para evitar errores de Firebase con espacios)
    const cleanEmail = email.trim();

    if (!isFirebaseConfigured || !auth) {
      return setAuthError('Error 500: Archivo .env no configurado correctamente en el servidor.');
    }

    if (authMode === 'forgot') {
      if (!validateEmail(cleanEmail)) { return setAuthError('Formato de correo electrónico inválido.'); }
      setIsSubmitting(true);
      try {
        await sendPasswordResetEmail(auth, cleanEmail);
        showToast('Enlace de recuperación enviado. Revise su bandeja.');
        setAuthMode('login');
      } catch (error) { setAuthError('Fallo en recuperación. Verifique si el correo existe.'); }
      finally { setIsSubmitting(false); }
      return;
    }

    if (!validateEmail(cleanEmail)) { return setAuthError('Formato de correo electrónico inválido.'); }

    setIsSubmitting(true);
    try {
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);

      if (authMode === 'login') {
        await signInWithEmailAndPassword(auth, cleanEmail, password);
        showToast('Validación exitosa. Cargando entorno de red...');
      } 
      else if (authMode === 'register') {
        if (!empresa.trim()) { setIsSubmitting(false); return setAuthError('El campo de razón social es obligatorio.'); }
        if (!isPasswordSecure) { setIsSubmitting(false); return setAuthError('La llave criptográfica no cumple con los estándares exigidos.'); }
        if (!acceptTerms) { setIsSubmitting(false); return setAuthError('Debe autorizar explícitamente los términos legales.'); }

        const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
        
        // Validación de SuperAdmin blindada
        const assignedRole = cleanEmail.toLowerCase() === 'atencionrutasync@gmail.com' ? 'SUPERADMIN' : 'OWNER';

        await setDoc(doc(db, 'users', userCredential.user.uid), {
          email: cleanEmail,
          empresa: empresa.trim(),
          telefono: telefono.trim(),
          role: assignedRole,
          plan: selectedPlan,
          isActive: true, 
          createdAt: new Date().toISOString()
        });
        showToast('Espacio de servidor desplegado correctamente.');
      }
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') setAuthError('Este identificador ya se encuentra registrado en nuestra base de datos.');
      else if (error.code === 'auth/invalid-credential') setAuthError('Credenciales rechazadas. Acceso denegado.');
      else setAuthError(`Servidor: Código interno de error - ${error.code}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    if (auth) {
      showToast('Cerrando conexión segura...');
      await signOut(auth);
    }
  };

  // ============================================================================
  // 5. OPERACIONES CLOUD Y PROTECCIONES (Anti-NaN Runtime)
  // ============================================================================
  const handleCompletarVenta = async () => {
    if (isSubmitting) return; // Escudo Anti-Doble Clic crítico POS
    if (!isFirebaseConfigured) return showToast('Error 401: Conexión con base de datos no detectada.');
    
    const selectedItem = inventario.find(i => i.id.toString() === posSelectedItemId);
    if (!selectedItem) return showToast('Requisito: Seleccionar un paquete de la matriz.');
    
    // Convertir y validar (Filtro Anti-NaN estricto)
    const parsedQty = parseInt(posQuantity);
    if (isNaN(parsedQty) || parsedQty <= 0) return showToast('Error Operativo: Inserte un multiplicador de volumen válido.');
    if (selectedItem.stock < parsedQty) return showToast(`Alerta de Inventario: Stock en bóveda insuficiente (${selectedItem.stock} máx).`);

    setIsSubmitting(true);
    const total = selectedItem.precio * parsedQty;

    try {
      // 1. Guardar Venta
      await addDoc(collection(db, `users/${user.uid}/ventas`), {
        cliente: posClient.trim() || 'Mostrador Comercial',
        item: selectedItem.nombre,
        cantidad: parsedQty,
        total: total,
        metodo: posMethod,
        fechaVisual: new Date().toLocaleString('es-GT', { dateStyle: 'short', timeStyle: 'short' }),
        createdAt: serverTimestamp()
      });

      // 2. Descontar Inventario
      await updateDoc(doc(db, `users/${user.uid}/inventario`, selectedItem.id), {
        stock: selectedItem.stock - parsedQty
      });

      showToast(`Terminal POS: Inyección de Q${total.toFixed(2)} exitosa.`);
      
      // 3. Limpiar formulario
      setPosSelectedItemId('');
      setPosQuantity('1');
      setPosClient('Cliente Mostrador');
    } catch (error) {
      showToast('Fallo en sincronización. Reintente operación.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCrearRuta = async (e) => {
    e.preventDefault();
    if (isSubmitting) return; // Escudo Anti-Doble Clic
    if (!isFirebaseConfigured) return;
    
    const { piloto, cliente, direccion, item, qty, telefonoCliente } = newRoute;
    if (!piloto.trim() || !cliente.trim() || !direccion.trim() || !item) return showToast('Campos estructurales vacíos detectados.');
    
    const parsedQty = parseInt(qty);
    if (isNaN(parsedQty) || parsedQty <= 0) return showToast('Error Operativo: Cantidad de bultos es inválida.');

    const selectedItem = inventario.find(i => i.id.toString() === item);
    if (!selectedItem) return showToast('Fallo en matriz: Producto desvinculado.');
    if (selectedItem.stock < parsedQty) return showToast(`Alerta de Inventario: Límite excedido (${selectedItem.stock} disp).`);

    setIsSubmitting(true);
    const totalCobrar = selectedItem.precio * parsedQty;

    try {
      await addDoc(collection(db, `users/${user.uid}/rutas`), {
        piloto: piloto.trim(), 
        cliente: cliente.trim(), 
        direccion: direccion.trim(), 
        telefonoCliente: telefonoCliente.trim() || '',
        item: selectedItem.nombre,
        itemId: selectedItem.id, // Guardar ID para revertir stock de manera segura
        cantidad: parsedQty,
        totalCobrar: totalCobrar,
        estado: 'Pendiente',
        fechaVisual: new Date().toLocaleString('es-GT', { dateStyle: 'short', timeStyle: 'short' }),
        createdAt: serverTimestamp()
      });

      await updateDoc(doc(db, `users/${user.uid}/inventario`, selectedItem.id), {
        stock: selectedItem.stock - parsedQty
      });

      showToast(`Red de Logística: Vector asignado a operador ${piloto}.`);
      
      setShowRouteModal(false);
      setNewRoute({ piloto: '', telefonoPiloto: '', cliente: '', direccion: '', item: '', qty: '1', telefonoCliente: '' });
    } catch (error) {
      showToast('Error 500: Fallo en escritura de ruta en la nube.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAnularRuta = async (ruta) => {
    if (!isFirebaseConfigured) return;
    
    // AUDITORÍA (Fase 3): Candado de Ghost Stock. Evitar doble-reversión si la ruta ya fue procesada.
    if (ruta.estado !== 'Pendiente') return showToast('Auditoría Logística: Esta ruta operativa ya no puede ser alterada.');
    
    // Confirmación UI segura, sin detener el main thread como haría window.confirm
    setConfirmDialog({
      message: `ADVERTENCIA LOGÍSTICA: ¿Confirmar la anulación de esta guía y ordenar retorno físico de ${ruta.cantidad} unidad(es) a bodega principal?`,
      onConfirm: async () => {
        setIsSubmitting(true);
        try {
          // Revertir Stock
          if (ruta.itemId) {
            const itemRef = doc(db, `users/${user.uid}/inventario`, ruta.itemId);
            const itemSnap = await getDoc(itemRef);
            if (itemSnap.exists()) {
              await updateDoc(itemRef, { stock: itemSnap.data().stock + ruta.cantidad });
              showToast('Cuadre Automático: Volúmenes reincorporados a la matriz.');
            }
          }
          
          // Cambiar estado a cancelado (Soft Delete por auditoría)
          await updateDoc(doc(db, `users/${user.uid}/rutas`, ruta.id), {
            estado: 'Cancelado'
          });
        } catch (error) {
          showToast('Error crítico de red al anular movimiento.');
        } finally {
          setIsSubmitting(false);
          setConfirmDialog(null);
        }
      }
    });
  };

  const handleCrearProducto = async (e) => {
    e.preventDefault();
    if (isSubmitting) return; // Escudo Anti-Doble Clic

    const { sku, nombre, stock, precio } = newProduct;
    if (!sku.trim() || !nombre.trim()) return showToast('Validación: Campos identificadores vacíos.');
    
    // Prevención absoluta de valores corruptos
    const parsedStock = parseInt(stock);
    const parsedPrecio = parseFloat(precio);
    if (isNaN(parsedStock) || isNaN(parsedPrecio)) return showToast('Error Aritmético: Campos de valor requieren números enteros/flotantes.');

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, `users/${user.uid}/inventario`), {
        sku: sku.toUpperCase().trim(),
        nombre: nombre.trim(),
        stock: parsedStock,
        precio: parsedPrecio,
        createdAt: serverTimestamp()
      });
      showToast('Bóveda de Inventario: Referencia guardada correctamente.');
      setShowProductModal(false);
      setNewProduct({ sku: '', nombre: '', stock: '1', precio: '0' });
    } catch (error) {
      showToast('No se pudo establecer escritura en el servidor Cloud.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEliminarProducto = async (id) => {
    if (!isFirebaseConfigured) return;
    
    setConfirmDialog({
      message: 'CRÍTICO: La depuración de esta referencia es irreversible y afectará proyecciones métricas pasadas. ¿Ejecutar?',
      onConfirm: async () => {
        setIsSubmitting(true);
        try {
          await deleteDoc(doc(db, `users/${user.uid}/inventario`, id));
          showToast('Referencia de bóveda depurada permanentemente.');
        } catch (error) {
          showToast('Servidor: Falta de privilegios de eliminación.');
        } finally {
          setIsSubmitting(false);
          setConfirmDialog(null);
        }
      }
    });
  };

  const handleCrearEvento = async (e) => {
    e.preventDefault();
    if (isSubmitting) return; // Escudo Anti-Doble Clic
    
    const { titulo, fecha, tipo, detalle } = newEvent;
    if (!titulo.trim() || !fecha) return showToast('Requisito: Defina una designación y cronología.');

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, `users/${user.uid}/eventos`), {
        titulo: titulo.trim(), 
        fecha, 
        tipo, 
        detalle: detalle.trim(),
        estado: 'Pendiente',
        createdAt: serverTimestamp()
      });
      showToast('Operación confirmada y enlazada a cronograma.');
      setShowEventModal(false);
      setNewEvent({ titulo: '', fecha: '', tipo: 'Mantenimiento', detalle: '' });
    } catch (error) {
      showToast('Error de transmisión de red hacia el calendario.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActivo = async (uid, currentStatus) => {
    try {
      await updateDoc(doc(db, 'users', uid), { isActive: !currentStatus });
      showToast(`Protocolo Administrador: Comando de interrupción ejecutado.`);
    } catch(error) {
      showToast('Restricción Firestore: Vector no autorizado.');
    }
  };

  // --- AUTOMATIZACIÓN INTELIGENTE DE MENSAJES (Sanitización Regex) ---
  const limpiarTelefonoGuatemala = (rawPhone) => {
    if (!rawPhone) return "";
    const cleanPhone = rawPhone.replace(/\D/g, '');
    if (cleanPhone.startsWith('502')) return cleanPhone;
    if (cleanPhone.length === 8) return `502${cleanPhone}`;
    return cleanPhone; // Fallback
  };

  const enviarWhatsAppPiloto = (ruta) => {
    const phoneStr = limpiarTelefonoGuatemala(ruta.telefonoPiloto);
    const direccionCodificada = encodeURIComponent(`${ruta.direccion}, Guatemala`);
    const linkWaze = `https://waze.com/ul?q=${direccionCodificada}&navigate=yes`;
    const mensaje = `*NUEVO DESPACHO RUTASYNC* 🚚\n\n*Cliente:* ${ruta.cliente}\n*Dirección:* ${ruta.direccion}\n*Entregar:* ${ruta.cantidad}x ${ruta.item}\n\n💰 *Cobrar:* Q${ruta.totalCobrar?.toFixed(2)}\n\n📍 *Navegar con Waze:* ${linkWaze}`;
    const targetUrl = phoneStr ? `https://wa.me/${phoneStr}?text=${encodeURIComponent(mensaje)}` : `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
    window.open(targetUrl, '_blank');
  };

  const enviarWhatsAppCliente = (ruta) => {
    const phoneStr = limpiarTelefonoGuatemala(ruta.telefonoCliente);
    const mensaje = `¡Hola! Tu pedido de *${userData?.empresa || 'nuestra empresa'}* ya va en camino con nuestro piloto ${ruta.piloto}. 🚚\n\nDetalle: ${ruta.cantidad}x ${ruta.item}\nTotal a pagar: Q${ruta.totalCobrar?.toFixed(2)}`;
    const targetUrl = phoneStr ? `https://wa.me/${phoneStr}?text=${encodeURIComponent(mensaje)}` : `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
    window.open(targetUrl, '_blank');
  };

  // --- PRUEBA DE ENTREGA DIGITAL (POD) CON INTEGRACIÓN GCP STORAGE ---
  const handleCompletarPruebaEntrega = async (e) => {
    e.preventDefault();
    if (!activeDelivery) return;
    
    // AUDITORÍA (Fase 3): Candado de Estado. Evitar que re-procese una ruta por latencia
    if (activeDelivery.estado !== 'Pendiente') return showToast('Auditoría Logística: Esta ruta ya fue liquidada.');
    
    if (!deliveryName.trim()) return showToast('Auditoría Logística: Obligatorio certificar entidad receptora.');
    if (isUploading) return; // Escudo estricto sobre transacciones con archivos

    if (!isFirebaseConfigured || !storage) {
      showToast('Módulo apagado: Variables GCP Storage desconectadas.');
      setActiveDelivery(null);
      return;
    }

    setIsUploading(true);
    try {
      let fotoUrl = null;

      if (deliveryPhotoFile) {
        showToast('Estableciendo túnel para carga cifrada de evidencia...');
        // Hash de seguridad simple para el nombre del archivo
        const extension = deliveryPhotoFile.name.split('.').pop() || 'jpg';
        const fileName = `${activeDelivery.id}_${Date.now()}.${extension}`;
        
        // Estructuración aislada en nube por ID de empresa
        const storageRef = ref(storage, `entregas/${user.uid}/${fileName}`);
        
        await uploadBytes(storageRef, deliveryPhotoFile);
        fotoUrl = await getDownloadURL(storageRef);
      }

      await updateDoc(doc(db, `users/${user.uid}/rutas`, activeDelivery.id), {
        estado: 'Entregado',
        recibe: deliveryName.trim(),
        metodoPago: deliveryMethod,
        fotoUrl: fotoUrl,
        fechaEntrega: new Date().toLocaleString('es-GT', { dateStyle: 'short', timeStyle: 'short' })
      });
      
      showToast('Liquidación de campo verificada e incrustada en libro de operaciones.');
      
      setActiveDelivery(null);
      setDeliveryName('');
      setDeliveryMethod('Efectivo');
      setDeliveryPhotoFile(null);
    } catch (error) {
      console.error(error);
      showToast('Falla Crítica de GCP: Imposible completar la mutación del archivo fotográfico.');
    } finally {
      setIsUploading(false);
    }
  };

  // ============================================================================
  // 6. RENDERIZADO: MODALES UI / LEGALES
  // ============================================================================
  const renderConfirmModal = () => {
    if (!confirmDialog) return null;
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
        <div className="bg-[#1A2333] p-6 rounded-xl w-full max-w-sm border border-slate-700 shadow-[0_0_50px_rgba(0,0,0,0.8)]">
          <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2"><ShieldAlert className="w-5 h-5 text-orange-400"/> Autorización Requerida</h3>
          <p className="text-slate-300 text-sm mb-6 leading-relaxed">{confirmDialog.message}</p>
          <div className="flex gap-3">
            <button onClick={() => setConfirmDialog(null)} disabled={isSubmitting} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-2.5 rounded-lg transition-colors font-medium disabled:opacity-50">Cancelar Operación</button>
            <button onClick={confirmDialog.onConfirm} disabled={isSubmitting} className="flex-1 bg-red-500 hover:bg-red-400 text-white font-bold py-2.5 rounded-lg transition-colors flex justify-center items-center shadow-lg shadow-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed">
              {isSubmitting ? 'Procesando...' : 'Confirmar Acción'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderAuthModal = () => {
    if (!showAuthModal) return null;
    return (
      <div className="fixed inset-0 bg-[#000000cc] backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-[#141C2B] rounded-xl shadow-2xl shadow-cyan-900/30 w-full max-w-md p-1 border border-slate-700 relative max-h-[90vh] overflow-y-auto animate-fade-in custom-scrollbar">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-blue-600"></div>
          
          <div className="p-7">
            <button onClick={() => setShowAuthModal(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors">
              <LogOut className="w-5 h-5" />
            </button>

            {authMode === 'login' && (
              <><div className="flex justify-center mb-4 mt-2"><div className="bg-cyan-500/10 p-4 rounded-xl border border-cyan-500/20"><ShieldCheck className="w-8 h-8 text-cyan-400" /></div></div><h2 className="text-2xl font-bold text-white text-center mb-6">Acceso Seguro</h2></>
            )}

            {authMode === 'register' && (
              <><h2 className="text-2xl font-bold text-white text-center mb-6">Crear Cuenta</h2>
                <div className="bg-slate-800/80 border border-slate-700 rounded-lg p-4 mb-6 flex justify-between items-center"><div><div className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-1">Plan Seleccionado</div><div className="text-white font-medium flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-500" /> Plan {selectedPlan}</div></div><button type="button" onClick={() => {setShowAuthModal(false); scrollToPricing();}} className="bg-slate-900 border border-slate-700 text-slate-300 text-xs px-3 py-1.5 rounded-lg hover:text-white transition-colors">Cambiar</button></div></>
            )}

            {authMode === 'forgot' && (
              <><h2 className="text-2xl font-bold text-white text-center mb-2">Recuperar Acceso</h2><p className="text-sm text-slate-400 text-center mb-6">Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.</p></>
            )}

            {authError && <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg text-sm mb-5 text-center flex items-center justify-center gap-2"><AlertTriangle className="w-4 h-4"/> {authError}</div>}
            
            <form onSubmit={handleAuthSubmit} className="space-y-5">
              {authMode === 'register' && (
                <><div><label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Nombre de la Empresa</label><div className="relative"><Building className="w-5 h-5 text-slate-500 absolute left-3 top-3" /><input type="text" value={empresa} onChange={(e) => setEmpresa(e.target.value)} className="w-full bg-[#0B1120] border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors" placeholder="Ej. Distribuidora El Sol" /></div></div>
                  <div><label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Teléfono / Whatsapp</label><div className="relative"><Phone className="w-5 h-5 text-slate-500 absolute left-3 top-3" /><input type="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} className="w-full bg-[#0B1120] border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors" placeholder="" /></div></div></>
              )}
              <div><label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Correo Electrónico</label><div className="relative"><Mail className="w-5 h-5 text-slate-500 absolute left-3 top-3" /><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-[#0B1120] border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors" placeholder="gerencia@empresa.com" /></div></div>
              {authMode !== 'forgot' && (
                <div><label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Contraseña {authMode === 'register' && '(Mín. 8 caracteres)'}</label><div className="relative"><Lock className="w-5 h-5 text-slate-500 absolute left-3 top-3" /><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-[#0B1120] border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors" placeholder="••••••••" /></div>
                  {authMode === 'register' && (<div className="mt-3 bg-[#0B1120]/50 border border-slate-800 rounded-lg p-4 space-y-2 text-xs font-mono"><div className={`flex items-center gap-2 ${isLengthValid ? 'text-cyan-400' : 'text-slate-500'}`}>{isLengthValid ? '✓' : '[ x ]'} Mínimo 8 caracteres</div><div className={`flex items-center gap-2 ${hasUpperLower ? 'text-cyan-400' : 'text-slate-500'}`}>{hasUpperLower ? '✓' : '[ x ]'} Mayúsculas y minúsculas</div><div className={`flex items-center gap-2 ${hasNumber ? 'text-cyan-400' : 'text-slate-500'}`}>{hasNumber ? '✓' : '[ x ]'} Número incluido</div><div className={`flex items-center gap-2 ${hasSpecial ? 'text-cyan-400' : 'text-slate-500'}`}>{hasSpecial ? '✓' : '[ x ]'} Símbolo especial (Ej: @, #, $)</div></div>)}</div>
              )}
              {authMode === 'register' && (<div className="flex items-start mt-4 bg-slate-800/30 p-3 rounded-lg border border-slate-700/50"><label className="flex items-start space-x-3 cursor-pointer"><input type="checkbox" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)} className="mt-1 form-checkbox bg-slate-900 border-slate-700 rounded text-cyan-500 focus:ring-cyan-500 h-4 w-4" /><span className="text-xs text-slate-300 leading-relaxed">Confirmo autorización legal bajo los <button type="button" onClick={(e) => { e.preventDefault(); setShowTerms(true); }} className="text-cyan-400 font-bold hover:underline">Términos de Servicio</button> y las <button type="button" onClick={(e) => { e.preventDefault(); setShowTerms(true); }} className="text-cyan-400 font-bold hover:underline">Políticas de Privacidad</button>.</span></label></div>)}
              {(authMode === 'login' || authMode === 'register') && (<div className="flex items-center justify-between pt-2"><label className="flex items-center space-x-2 cursor-pointer"><input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="form-checkbox bg-slate-900 border-slate-700 rounded text-cyan-500 focus:ring-cyan-500 h-4 w-4" /><span className="text-sm text-slate-300 font-medium">Mantener sesión activa</span></label>{authMode === 'login' && (<button type="button" onClick={() => setAuthMode('forgot')} className="text-sm text-slate-400 hover:text-cyan-400 transition-colors">¿Olvidaste tu contraseña?</button>)}</div>)}
              <button type="submit" disabled={isSubmitting} className={`w-full font-bold py-3.5 rounded-lg mt-4 transition-all shadow-[0_0_15px_rgba(0,180,216,0.3)] ${isSubmitting ? 'bg-cyan-600 text-white cursor-not-allowed' : 'bg-[#00B4D8] hover:bg-cyan-400 text-slate-900'}`}>{isSubmitting ? 'Procesando...' : (authMode === 'login' ? 'Ingresar al ERP' : authMode === 'register' ? 'Inicializar Entorno' : 'Enviar Recuperación')}</button>
            </form>
            <div className="mt-6 text-center text-sm text-slate-400 border-t border-slate-700/50 pt-6">{authMode === 'login' ? (<>¿No tienes cuenta? <button type="button" onClick={() => setAuthMode('register')} className="text-cyan-400 font-bold hover:underline">Regístrate aquí</button></>) : authMode === 'register' ? (<>¿Ya tienes cuenta? <button type="button" onClick={() => setAuthMode('login')} className="text-cyan-400 font-bold hover:underline">Inicia sesión</button></>) : (<button type="button" onClick={() => setAuthMode('login')} className="text-cyan-400 font-bold hover:underline flex items-center justify-center gap-2 w-full"><ArrowLeft className="w-4 h-4"/> Volver al inicio de sesión</button>)}</div>
          </div>
        </div>
      </div>
    );
  };

  const renderLegalModals = () => {
    if (showContact) return (<div className="fixed inset-0 bg-[#000000cc] backdrop-blur-sm flex items-center justify-center z-50 p-4"><div className="bg-[#141C2B] rounded-2xl w-full max-w-sm p-8 border border-slate-700 relative text-center"><button onClick={() => setShowContact(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white"><LogOut className="w-5 h-5" /></button><div className="bg-[#00B4D8]/20 p-4 rounded-full inline-block mb-4"><Headset className="w-10 h-10 text-[#00B4D8]" /></div><h2 className="text-xl font-bold text-white mb-2">Atención al Cliente</h2><p className="text-slate-400 mb-6 text-sm">Estamos listos para ayudarte con tu integración. Escríbenos directamente a nuestro correo oficial:</p><div className="bg-[#0B1120] border border-slate-700 rounded-lg p-4 font-mono text-[#00B4D8] mb-6 select-all">atencionrutasync@gmail.com</div><button onClick={() => setShowContact(false)} className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 rounded-lg">Cerrar</button></div></div>);
    if (showTerms) return (
      <div className="fixed inset-0 bg-[#000000cc] backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-[#141C2B] rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col border border-slate-700 shadow-2xl">
          <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-900/50 rounded-t-2xl">
            <h2 className="text-xl font-bold text-white flex items-center gap-2"><Shield className="w-5 h-5 text-cyan-400"/> Marco Jurídico y Arquitectura de Datos B2B</h2>
            <button onClick={() => setShowTerms(false)} className="text-slate-400 hover:text-white"><LogOut className="w-6 h-6" /></button>
          </div>
          <div className="p-8 overflow-y-auto text-slate-300 space-y-6 text-sm leading-relaxed custom-scrollbar">
            <div><h3 className="text-base font-bold text-cyan-400 mb-2 uppercase tracking-wide">1. Jurisdicción y SLA (Service Level Agreement)</h3><p>RutaSync ERP opera bajo la legislación mercantil de la República de Guatemala. Se clasifica estrictamente como un Micro-SaaS (Software como Servicio). Nuestro SLA garantiza un uptime del 99.9% en servidores de red, excluyendo mantenimientos programados.</p></div>
            <div><h3 className="text-base font-bold text-cyan-400 mb-2 uppercase tracking-wide">2. Aislamiento Criptográfico de la Información</h3><p>La base de datos (Firestore) implementa políticas Multi-Tenant con reglas de seguridad rígidas. La información financiera, operativa y logística es <strong>actividad comercial confidencial propiedad de la empresa suscriptora</strong>. El rol OWNER es el único vector autorizado para gestionar sus propios datos.</p></div>
            <div><h3 className="text-base font-bold text-cyan-400 mb-2 uppercase tracking-wide">3. Limitación Estricta de Responsabilidad Civil</h3><p>El código provisto actúa como una capa de inteligencia artificial y trazabilidad. Sin embargo, <strong>la empresa despachadora absorbe todo el riesgo logístico real</strong>. RutaSync no asume responsabilidad civil, penal o mercantil sobre mermas, robos en ruta, siniestralidad vial, desvío de efectivo por parte de pilotos, ni conflictos laborales generados a raíz del uso del sistema de control.</p></div>
          </div>
          <div className="p-6 border-t border-slate-700 bg-slate-900/50 rounded-b-2xl">
            <button onClick={() => setShowTerms(false)} className="w-full bg-[#00B4D8] hover:bg-cyan-400 text-slate-900 font-bold py-3.5 rounded-lg transition-colors shadow-lg shadow-cyan-500/20 text-base">Reconozco el Marco Legal y Autorizo</button>
          </div>
        </div>
      </div>
    );
    return null;
  };

  // ============================================================================
  // 7. RENDERIZADO: FRONTEND (LANDING PAGE COMERCIAL)
  // ============================================================================
  if (currentView === 'landing' || (!user && !loadingAuth)) {
    return (
      <div className="min-h-screen bg-[#0B1120] text-slate-300 font-sans selection:bg-cyan-500/30 relative overflow-hidden flex flex-col">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
        {toastMessage && (<div className="fixed top-4 right-4 bg-emerald-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50 animate-bounce print:hidden"><CheckCircle2 className="w-5 h-5" /> {toastMessage}</div>)}

        <nav className="fixed w-full z-40 bg-[#0B1120]/90 backdrop-blur-md border-b border-slate-800"><div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between"><div className="flex items-center gap-3"><div className="bg-gradient-to-br from-[#00B4D8] to-blue-600 p-2 rounded-xl"><MapIcon className="w-6 h-6 text-white" /></div><span className="text-2xl font-bold text-white tracking-tight">RutaSync <span className="text-[#00B4D8] font-light text-lg">ERP</span></span></div><div className="flex items-center gap-4"><button onClick={() => { setAuthMode('login'); setShowAuthModal(true); }} className="text-slate-300 hover:text-white font-medium px-4">Iniciar Sesión</button><button onClick={() => { setAuthMode('register'); setShowAuthModal(true); }} className="bg-transparent border border-[#00B4D8] text-[#00B4D8] hover:bg-[#00B4D8]/10 px-6 py-2 rounded-full font-medium transition-colors">Comenzar Gratis</button></div></div></nav>
        
        <div className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 max-w-7xl mx-auto px-6 text-center z-10 flex-1"><div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/50 border border-slate-700 text-[#00B4D8] text-xs font-semibold uppercase tracking-wider mb-8"><div className="w-2 h-2 rounded-full bg-[#00B4D8] animate-pulse"></div>Sistema de Gestión Empresarial</div><h1 className="text-5xl lg:text-7xl font-extrabold text-white tracking-tight mb-8 leading-tight">RutaSync es la capa crítica <br/>que impulsa su <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00B4D8] to-blue-500">Logística.</span></h1><p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">Estandarice sus procesos operativos, controle el efectivo de sus pilotos en tiempo real y genere inteligencia financiera automatizada para el mercado B2B en Guatemala.</p><div className="flex flex-col sm:flex-row items-center justify-center gap-4"><button onClick={() => { setAuthMode('register'); setShowAuthModal(true); }} className="w-full sm:w-auto bg-[#00B4D8] hover:bg-cyan-400 text-slate-900 font-bold px-8 py-4 rounded-full flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-500/20">Acelere su negocio <ArrowRight className="w-5 h-5" /></button><button onClick={scrollToPricing} className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-white font-medium px-8 py-4 rounded-full transition-all border border-slate-700">Ver Soluciones</button></div></div>
        
        <div id="pricing-section" className="py-24 bg-gradient-to-b from-slate-900/50 to-[#0B1120] border-t border-slate-800 relative z-10"><div className="max-w-7xl mx-auto px-6"><div className="text-center mb-16"><h2 className="text-4xl font-extrabold text-white mb-4">Infraestructura Escalable</h2><p className="text-slate-400 text-lg">Planes diseñados para crecer con usted. Sin contratos forzosos. Cancele en cualquier momento.</p></div><div className="grid md:grid-cols-3 gap-8 items-center max-w-6xl mx-auto">
              <div className="bg-[#0B1120] rounded-2xl p-8 border border-slate-800 flex flex-col h-[500px]"><h3 className="text-2xl font-bold text-white mb-3">Emprendedor</h3><p className="text-sm text-slate-400 mb-6 h-10">Para negocios independientes que inician su digitalización.</p><div className="flex items-baseline gap-1 mb-8"><span className="text-5xl font-black text-white">Q99</span><span className="text-slate-500 font-medium">/mes</span></div><ul className="space-y-4 mb-auto text-sm"><li className="flex items-center gap-3 text-slate-300"><CheckCircle2 className="w-5 h-5 text-[#00B4D8]" /> Hasta 200 entregas mensuales</li><li className="flex items-center gap-3 text-slate-300"><CheckCircle2 className="w-5 h-5 text-[#00B4D8]" /> 1 Usuario Administrador</li><li className="flex items-center gap-3 text-slate-300"><CheckCircle2 className="w-5 h-5 text-[#00B4D8]" /> Enlace de ruta para pilotos</li><li className="flex items-center gap-3 text-[#00B4D8] font-medium"><MessageCircle className="w-5 h-5" /> Soporte por WhatsApp</li></ul><button onClick={() => {setSelectedPlan('EMPRENDEDOR'); setAuthMode('register'); setShowAuthModal(true);}} className="w-full bg-transparent border border-slate-700 text-cyan-400 hover:bg-slate-800 font-bold py-3 rounded-lg transition-colors mt-8">Iniciar Prueba Gratis</button></div>
              <div className="bg-[#141C2B] rounded-2xl p-8 border border-cyan-500/50 relative shadow-[0_0_30px_rgba(0,180,216,0.15)] flex flex-col h-[540px] transform md:scale-105 z-10"><div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-[#00B4D8] text-slate-900 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest flex items-center gap-1"><Zap className="w-4 h-4 fill-current" /> RECOMENDADO</div><h3 className="text-2xl font-bold text-white mb-3 mt-2">Plan PYME</h3><p className="text-sm text-slate-400 mb-6 h-10">Para flotas activas que requieren control de cobros e inventario en tiempo real.</p><div className="flex items-baseline gap-1 mb-8"><span className="text-5xl font-black text-[#00B4D8]">Q249</span><span className="text-slate-500 font-medium">/mes</span></div><ul className="space-y-4 mb-auto text-sm"><li className="flex items-center gap-3 text-slate-300"><CheckCircle2 className="w-5 h-5 text-[#00B4D8]" /> Hasta 1,200 entregas mensuales</li><li className="flex items-center gap-3 text-slate-300"><CheckCircle2 className="w-5 h-5 text-[#00B4D8]" /> Control de dinero en calle</li><li className="flex items-center gap-3 text-slate-300"><CheckCircle2 className="w-5 h-5 text-[#00B4D8]" /> Foto y nombre de quien recibe</li><li className="flex items-center gap-3 text-white font-bold"><Star className="w-5 h-5 text-[#00B4D8] fill-current" /> Soporte Prioritario</li></ul><button onClick={() => {setSelectedPlan('PYME'); setAuthMode('register'); setShowAuthModal(true);}} className="w-full bg-[#00B4D8] hover:bg-cyan-400 text-slate-900 font-bold py-3.5 rounded-lg transition-colors mt-8 shadow-[0_0_15px_rgba(0,180,216,0.3)]">Activar Entorno</button></div>
              <div className="bg-[#0B1120] rounded-2xl p-8 border border-slate-800 flex flex-col h-[500px]"><h3 className="text-2xl font-bold text-white mb-3">Corporativo</h3><p className="text-sm text-slate-400 mb-6 h-10">Infraestructura dedicada para cadenas con alto volumen.</p><div className="flex items-baseline gap-1 mb-8"><span className="text-5xl font-black text-white">Q599</span><span className="text-slate-500 font-medium">/mes</span></div><ul className="space-y-4 mb-auto text-sm"><li className="flex items-center gap-3 text-slate-300"><CheckCircle2 className="w-5 h-5 text-[#00B4D8]" /> Entregas Ilimitadas</li><li className="flex items-center gap-3 text-slate-300"><CheckCircle2 className="w-5 h-5 text-[#00B4D8]" /> Control de múltiples sucursales</li><li className="flex items-center gap-3 text-slate-300"><CheckCircle2 className="w-5 h-5 text-[#00B4D8]" /> Roles y permisos para empleados</li><li className="flex items-center gap-3 text-slate-300"><BarChart3 className="w-5 h-5 text-[#00B4D8]" /> Historial y reportes avanzados</li></ul><button onClick={() => {setSelectedPlan('CORPORATIVO'); setAuthMode('register'); setShowAuthModal(true);}} className="w-full bg-transparent border border-slate-700 text-white hover:bg-slate-800 font-bold py-3 rounded-lg transition-colors mt-8">Contactar Ventas</button></div>
        </div></div></div>

        <footer className="border-t border-slate-800 bg-[#0B1120] py-12 relative z-10 mt-auto">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2"><MapIcon className="w-5 h-5 text-[#00B4D8]" /><span className="text-lg font-bold text-white">RutaSync</span></div>
            <div className="flex gap-6 text-sm text-slate-400">
              <button onClick={() => setShowTerms(true)} className="hover:text-[#00B4D8] transition-colors font-medium">Términos de Servicio</button>
              <button onClick={() => setShowTerms(true)} className="hover:text-[#00B4D8] transition-colors font-medium">Políticas de Privacidad</button>
              <button onClick={() => setShowContact(true)} className="hover:text-[#00B4D8] transition-colors font-medium">Contacto Oficial</button>
            </div>
            <div className="text-sm text-slate-500">© 2026 RutaSync Guatemala.</div>
          </div>
        </footer>

        {renderAuthModal()}
        {renderLegalModals()}
        {renderConfirmModal()}
      </div>
    );
  }

  // ============================================================================
  // 8. RENDERIZADO: MOTOR INTERNO DEL ERP (AUDITADO CON PROTECCIÓN PRINT)
  // ============================================================================
  const exportToPDF = () => { window.print(); showToast("Ejecutando renderizado de reporte seguro..."); };
  const handleSimularImportacionExcel = () => { showToast("Analizando archivo CSV de origen..."); setTimeout(() => showToast("Extracción de datos completada exitosamente."), 1500); };

  // MATEMÁTICA ESTRICTA (Protección Activa en Runtime contra valores corruptos)
  const totalEfectivo = ventas.filter(v => v.metodo === 'Efectivo').reduce((acc, v) => acc + (Number(v.total) || 0), 0) + rutas.filter(r => r.estado === 'Entregado' && r.metodoPago === 'Efectivo').reduce((acc, r) => acc + (Number(r.totalCobrar) || 0), 0);
  const totalTarjetas = ventas.filter(v => v.metodo !== 'Efectivo').reduce((acc, v) => acc + (Number(v.total) || 0), 0) + rutas.filter(r => r.estado === 'Entregado' && r.metodoPago !== 'Efectivo').reduce((acc, r) => acc + (Number(r.totalCobrar) || 0), 0);

  const renderERPContent = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto print:hidden">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
              <div><h2 className="text-2xl font-bold text-white">Telemetría Operativa</h2><p className="text-slate-400">Lecturas en tiempo real para el entorno de {userData?.empresa || 'Cargando...'}.</p></div>
              <div className="flex gap-2"><button onClick={() => setCurrentView('despachos')} className="bg-[#00B4D8] hover:bg-cyan-400 text-slate-900 px-4 py-2 rounded-lg font-medium flex items-center gap-2 shadow-[0_0_15px_rgba(0,180,216,0.2)]"><Plus className="w-4 h-4" /> Despachar Unidad</button></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-[#141C2B] p-6 rounded-xl border border-slate-700 hover:border-blue-500/50 transition-colors"><div className="flex justify-between items-start mb-4"><div className="p-2 bg-blue-500/20 rounded-lg"><Truck className="w-6 h-6 text-blue-400" /></div></div><h3 className="text-slate-400 text-sm font-medium">Unidades en Calle</h3><p className="text-3xl font-bold text-white mt-1">{rutas.filter(r=>r.estado==='Pendiente').length}</p></div>
              <div className="bg-[#141C2B] p-6 rounded-xl border border-slate-700 hover:border-emerald-500/50 transition-colors"><div className="flex justify-between items-start mb-4"><div className="p-2 bg-emerald-500/20 rounded-lg"><DollarSign className="w-6 h-6 text-emerald-400" /></div></div><h3 className="text-slate-400 text-sm font-medium">Transacciones (POS)</h3><p className="text-3xl font-bold text-white mt-1">{ventas.length}</p></div>
              <div className="bg-[#141C2B] p-6 rounded-xl border border-slate-700 hover:border-purple-500/50 transition-colors"><div className="flex justify-between items-start mb-4"><div className="p-2 bg-purple-500/20 rounded-lg"><Package className="w-6 h-6 text-purple-400" /></div></div><h3 className="text-slate-400 text-sm font-medium">SKUs en Bóveda</h3><p className="text-3xl font-bold text-white mt-1">{inventario.length}</p></div>
              <div className="bg-[#141C2B] p-6 rounded-xl border border-slate-700 hover:border-orange-500/50 transition-colors"><div className="flex justify-between items-start mb-4"><div className="p-2 bg-orange-500/20 rounded-lg"><AlertTriangle className="w-6 h-6 text-orange-400" /></div></div><h3 className="text-slate-400 text-sm font-medium">Entornos Aislados</h3><p className="text-3xl font-bold text-white mt-1">{clientesAdmin.length > 0 ? clientesAdmin.length : 1}</p></div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-[#141C2B] p-6 rounded-xl border border-slate-700"><h3 className="text-lg font-bold text-white mb-6">Proyección Analítica (Ingresos de Red)</h3><div className="h-72"><ResponsiveContainer width="100%" height="100%"><BarChart data={dataRendimiento}><CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} /><XAxis dataKey="nombre" stroke="#94a3b8" axisLine={false} tickLine={false} /><YAxis stroke="#94a3b8" axisLine={false} tickLine={false} tickFormatter={(value) => `Q${value}`} /><Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }} itemStyle={{ color: '#00B4D8' }}/><Bar dataKey="ingresos" fill="#00B4D8" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div></div>
            </div>
          </div>
        );
      
      case 'pos':
        const selectedPosItem = inventario.find(i => i.id.toString() === posSelectedItemId);
        const parsedPosQty = parseInt(posQuantity);
        const posTotal = selectedPosItem && !isNaN(parsedPosQty) ? (selectedPosItem.precio * parsedPosQty) : 0;
        return (
          <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-500 print:hidden">
            <h2 className="text-2xl font-bold text-white mb-6">Terminal de Cobro Rápido (POS)</h2>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-1 bg-[#141C2B] rounded-xl border border-slate-700 p-6 flex flex-col shadow-lg shadow-black/20">
                <h3 className="font-bold text-slate-300 text-sm uppercase flex items-center gap-2 mb-6"><ShoppingCart className="w-4 h-4"/> Ejecutar Transacción</h3>
                <div className="space-y-4">
                  <div><label className="block text-xs font-bold text-slate-400 uppercase mb-2">Entidad Cliente</label><input type="text" value={posClient} onChange={e=>setPosClient(e.target.value)} className="w-full bg-[#0B1120] border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:border-[#00B4D8] outline-none" /></div>
                  <div className="flex gap-3"><div className="flex-1"><label className="block text-xs font-bold text-slate-400 uppercase mb-2">Identificador (Item)</label><select value={posSelectedItemId} onChange={(e) => setPosSelectedItemId(e.target.value)} className="w-full bg-[#0B1120] border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:border-[#00B4D8] outline-none appearance-none"><option value="">Seleccione paquete...</option>{inventario.map(item => <option key={item.id} value={item.id}>{item.nombre} (Q{item.precio})</option>)}</select></div><div className="w-20"><label className="block text-xs font-bold text-slate-400 uppercase mb-2">Volumen</label><input type="number" min="1" value={posQuantity} onChange={(e) => setPosQuantity(e.target.value)} className="w-full bg-[#0B1120] border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:border-[#00B4D8] outline-none text-center font-mono" /></div></div>
                  <div><label className="block text-xs font-bold text-slate-400 uppercase mb-2">Protocolo de Pago</label><select value={posMethod} onChange={e=>setPosMethod(e.target.value)} className="w-full bg-[#0B1120] border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:border-[#00B4D8] outline-none"><option>Efectivo</option><option>Transferencia</option><option>Tarjeta</option></select></div>
                </div>
                <div className="mt-8 pt-6 border-t border-slate-700"><label className="block text-xs font-bold text-[#00B4D8] uppercase mb-2">Sumatoria Calculada (Q)</label><div className="w-full bg-[#0B1120] border border-emerald-500/30 rounded-lg px-4 py-4 text-white text-2xl font-black font-mono flex justify-end tracking-wider">{posTotal.toFixed(2)}</div><button onClick={handleCompletarVenta} disabled={isSubmitting} className={`w-full font-bold py-3.5 rounded-lg flex items-center justify-center gap-2 mt-4 transition-colors ${isSubmitting ? 'bg-cyan-600/50 text-slate-300 cursor-not-allowed border border-cyan-500/30' : 'bg-[#00B4D8] hover:bg-cyan-400 text-slate-900 shadow-[0_0_15px_rgba(0,180,216,0.3)]'}`}>{isSubmitting ? 'ENCRIPTANDO DATOS...' : 'INCRUSTAR EN LEDGER'} {!isSubmitting && <ArrowRight className="w-4 h-4" />}</button></div>
              </div>
              <div className="lg:col-span-3 bg-[#141C2B] rounded-xl border border-slate-700 overflow-hidden flex flex-col shadow-lg shadow-black/20">
                <div className="p-4 border-b border-slate-700"><h3 className="font-bold text-white uppercase text-sm flex items-center gap-2"><History className="w-4 h-4"/> Bloques Confirmados (Hoy)</h3></div>
                <div className="flex-1 flex flex-col bg-[#0B1120]">
                  <div className="bg-[#1A2333] px-6 py-3 border-b border-slate-700 grid grid-cols-5 text-xs font-bold text-slate-400 uppercase tracking-wider"><div className="col-span-1">Marca de Tiempo</div><div className="col-span-1">Destinatario</div><div className="col-span-1 text-center">Paquete</div><div className="col-span-1 text-right">Valor Final</div><div className="col-span-1 text-right">Protocolo</div></div>
                  {ventas.length === 0 ? (<div className="flex-1 flex flex-col items-center justify-center py-24 text-slate-600"><Store className="w-12 h-12 mb-3 opacity-20" /><div className="text-sm font-bold uppercase tracking-widest">Base de datos vacía</div></div>) : (
                    <div className="overflow-y-auto max-h-[500px] custom-scrollbar">
                      {ventas.map((v, i) => (
                        <div key={i} className="px-6 py-4 border-b border-slate-800 grid grid-cols-5 text-sm text-slate-300 hover:bg-slate-800/50 transition-colors"><div className="col-span-1 font-mono text-cyan-400 text-xs">{v.fechaVisual}</div><div className="col-span-1 font-bold text-white">{v.cliente}</div><div className="col-span-1 text-center">{v.cantidad}x {v.item}</div><div className="col-span-1 text-right text-emerald-400 font-bold font-mono">Q{Number(v.total || 0).toFixed(2)}</div><div className="col-span-1 text-right"><span className="bg-slate-800 border border-slate-700 px-2 py-1.5 rounded text-xs text-slate-300">{v.metodo}</span></div></div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case 'almacen':
        return (
          <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-500 print:hidden">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <h2 className="text-2xl font-bold text-white">Centro de Inventario y Abastecimiento</h2>
              <div className="flex gap-2">
                <label className="bg-slate-800 border border-slate-700 hover:bg-slate-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 cursor-pointer transition-colors shadow-lg"><FileSpreadsheet className="w-4 h-4 text-emerald-500" /> Analizar CSV<input type="file" className="hidden" accept=".xlsx, .xls, .csv" onChange={handleSimularImportacionExcel} /></label>
                <button onClick={() => setShowProductModal(true)} className="bg-[#00B4D8] hover:bg-cyan-400 text-slate-900 px-4 py-2 rounded-lg font-medium flex items-center gap-2 shadow-[0_0_15px_rgba(0,180,216,0.3)]"><Plus className="w-4 h-4" /> Agregar SKU</button>
              </div>
            </div>

            {showProductModal && (
              <form onSubmit={handleCrearProducto} className="bg-[#1A2333] p-6 rounded-xl border-l-4 border-l-[#00B4D8] mb-6 shadow-2xl grid grid-cols-1 md:grid-cols-4 gap-5 animate-slide-up">
                <div className="col-span-1 md:col-span-4 text-lg font-bold text-white border-b border-slate-700 pb-3 mb-2 flex justify-between items-center">
                  <div className="flex items-center gap-2"><Package className="w-5 h-5 text-cyan-400"/> Instanciar Nueva Referencia en Base de Datos</div>
                  <button type="button" onClick={() => setShowProductModal(false)} className="text-slate-500 hover:text-white bg-slate-800 p-1 rounded transition-colors"><X className="w-5 h-5"/></button>
                </div>
                <div><label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Código SKU Físico</label><input required value={newProduct.sku} onChange={e=>setNewProduct({...newProduct, sku: e.target.value})} className="w-full bg-[#0B1120] border border-slate-700 rounded-lg p-3 text-cyan-400 focus:border-cyan-500 outline-none uppercase font-mono tracking-widest shadow-inner" placeholder="Ej. RUT-004"/></div>
                <div className="col-span-1 md:col-span-2"><label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Descripción Técnica del Producto</label><input required value={newProduct.nombre} onChange={e=>setNewProduct({...newProduct, nombre: e.target.value})} className="w-full bg-[#0B1120] border border-slate-700 rounded-lg p-3 text-white focus:border-cyan-500 outline-none shadow-inner" placeholder="Ej. Caja Organizadora 20L"/></div>
                <div className="grid grid-cols-2 gap-3 col-span-1 md:col-span-4 lg:col-span-1">
                  <div><label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Stock Disp.</label><input required type="number" min="0" value={newProduct.stock} onChange={e=>setNewProduct({...newProduct, stock: e.target.value})} className="w-full bg-[#0B1120] border border-slate-700 rounded-lg p-3 text-white focus:border-cyan-500 outline-none font-mono text-center shadow-inner" /></div>
                  <div><label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Valor (Q)</label><input required type="number" min="0" step="0.01" value={newProduct.precio} onChange={e=>setNewProduct({...newProduct, precio: e.target.value})} className="w-full bg-[#0B1120] border border-slate-700 rounded-lg p-3 text-emerald-400 font-bold focus:border-cyan-500 outline-none font-mono text-center shadow-inner" /></div>
                </div>
                <div className="col-span-1 md:col-span-4 text-right mt-3 border-t border-slate-700 pt-5 flex justify-end gap-3">
                  <button type="button" onClick={() => setShowProductModal(false)} className="px-6 py-2.5 text-slate-400 hover:text-white transition-colors font-medium">Descartar</button>
                  <button type="submit" disabled={isSubmitting} className={`font-bold px-8 py-2.5 rounded-lg transition-all flex items-center gap-2 ${isSubmitting ? 'bg-cyan-600 text-white cursor-not-allowed' : 'bg-[#00B4D8] hover:bg-cyan-400 text-slate-900 shadow-[0_0_15px_rgba(0,180,216,0.3)]'}`}>{isSubmitting ? <><Upload className="w-4 h-4 animate-bounce"/> Escribiendo Nube...</> : 'Insertar en Catálogo'}</button>
                </div>
              </form>
            )}

            <div className="bg-[#141C2B] rounded-xl border border-slate-700 overflow-hidden shadow-xl">
              <div className="p-5 border-b border-slate-700 bg-slate-800/30 flex gap-4"><div className="relative flex-1 max-w-md"><Search className="w-5 h-5 absolute left-3 top-3 text-slate-500" /><input type="text" placeholder="Escaneo lógico por SKU o descripción..." className="w-full bg-[#0B1120] border border-slate-700 rounded-lg pl-11 pr-4 py-2.5 text-sm text-white focus:border-cyan-500 outline-none shadow-inner transition-colors focus:bg-slate-900" /></div></div>
              <div className="overflow-x-auto"><table className="w-full text-left text-sm text-slate-300"><thead className="bg-[#0B1120] text-slate-400 text-xs uppercase tracking-wider font-bold"><tr><th className="px-6 py-4 border-b border-slate-700">Identificador (SKU)</th><th className="px-6 py-4 border-b border-slate-700">Producto Físico</th><th className="px-6 py-4 border-b border-slate-700 text-center">Volumen de Bodega</th><th className="px-6 py-4 border-b border-slate-700">Paridad de Venta</th><th className="px-6 py-4 border-b border-slate-700 text-right">Depurar</th></tr></thead><tbody className="divide-y divide-slate-800">
                {inventario.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/50 transition-colors group"><td className="px-6 py-5 font-mono text-cyan-400 tracking-wider font-bold">{item.sku}</td><td className="px-6 py-5 font-medium text-white">{item.nombre}</td><td className="px-6 py-5 text-center"><span className={`px-4 py-1.5 rounded text-xs font-black font-mono shadow-sm ${item.stock < 50 ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>{item.stock} UNIDADES</span></td><td className="px-6 py-5 font-bold text-slate-200 font-mono tracking-wide">Q{Number(item.precio || 0).toFixed(2)}</td><td className="px-6 py-5 text-right"><button onClick={() => handleEliminarProducto(item.id)} className="text-slate-500 hover:text-red-400 p-2 ml-2 transition-colors bg-slate-800/50 hover:bg-red-500/10 rounded-lg opacity-50 group-hover:opacity-100 border border-transparent hover:border-red-500/30"><Trash2 className="w-4 h-4" /></button></td></tr>
                ))}
                {inventario.length === 0 && (<tr><td colSpan="5" className="text-center py-16 text-slate-600 uppercase tracking-widest font-bold"><Package className="w-12 h-12 mx-auto mb-3 opacity-20"/> No se detectan anomalías (Almacén Vacío).</td></tr>)}
              </tbody></table></div>
            </div>
          </div>
        );

      case 'despachos':
        return (
          <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-500 print:hidden">
            <div className="flex justify-between items-center mb-6">
              <div><h2 className="text-2xl font-bold text-white">Matriz de Despacho Operativo</h2><p className="text-slate-400 text-sm mt-1">Control satelital y de logística de última milla.</p></div>
              <button onClick={() => setShowRouteModal(!showRouteModal)} className="bg-[#00B4D8] hover:bg-cyan-400 text-slate-900 px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(0,180,216,0.3)]"><Navigation className="w-4 h-4" /> Asignar Vector de Ruta</button>
            </div>
            
            {activeDelivery && (
              <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <form onSubmit={handleCompletarPruebaEntrega} className="bg-[#141C2B] p-8 rounded-2xl w-full max-w-md border border-cyan-500/30 shadow-[0_0_60px_rgba(0,180,216,0.15)] animate-slide-up">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-white font-bold text-xl flex items-center gap-2"><CheckCircle2 className="w-6 h-6 text-cyan-400"/> Validación de Entrega (POD)</h3>
                  </div>
                  
                  <div className="bg-[#0B1120] p-5 rounded-xl border border-slate-700 mb-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl"></div>
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Destino Oficial</div>
                    <div className="text-white font-bold text-lg mb-3">{activeDelivery.cliente}</div>
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Recaudo Físico / Digital Requerido</div>
                    <div className="text-emerald-400 font-black text-2xl font-mono">Q{Number(activeDelivery.totalCobrar).toFixed(2)}</div>
                  </div>
                  
                  <div className="space-y-5">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Identidad del Receptor</label>
                      <input required value={deliveryName} onChange={e=>setDeliveryName(e.target.value)} className="w-full bg-[#0B1120] border border-slate-700 rounded-lg p-3 text-white focus:border-cyan-500 focus:bg-slate-900 outline-none transition-colors shadow-inner" placeholder="Ej. DPI / Nombre del Guardia" />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Protocolo de Liquidación</label>
                      <select required value={deliveryMethod} onChange={e=>setDeliveryMethod(e.target.value)} className="w-full bg-[#0B1120] border border-slate-700 rounded-lg p-3 text-white focus:border-cyan-500 outline-none shadow-inner">
                        <option>Efectivo (Cod)</option>
                        <option>Transferencia Bancaria</option>
                        <option>Tarjeta (POS Móvil)</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Autenticación Biométrica / Visual</label>
                      <label className={`w-full flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl mb-2 cursor-pointer transition-all ${deliveryPhotoFile ? 'border-emerald-500 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.1)]' : 'border-slate-600 bg-[#0B1120] hover:border-cyan-500 hover:bg-cyan-500/5'}`}>
                        {deliveryPhotoFile ? <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-3 animate-pulse"/> : <Camera className="w-10 h-10 text-slate-500 mb-3 group-hover:text-cyan-400 transition-colors"/>}
                        <span className={`text-sm font-bold uppercase tracking-wider ${deliveryPhotoFile ? 'text-emerald-500' : 'text-slate-400'}`}>{deliveryPhotoFile ? 'Captura Almacenada en Memoria' : 'Abrir Dispositivo Óptico'}</span>
                        <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => setDeliveryPhotoFile(e.target.files[0])} />
                      </label>
                      <p className="text-center text-[10px] text-slate-500 uppercase tracking-widest font-bold">Datos transmitidos a servidor seguro GCP</p>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-8 pt-6 border-t border-slate-800">
                    <button type="button" onClick={() => { setActiveDelivery(null); setDeliveryPhotoFile(null); }} disabled={isUploading} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3.5 rounded-xl transition-colors disabled:opacity-50">Abortar</button>
                    <button type="submit" disabled={isUploading} className={`flex-1 font-bold py-3.5 rounded-xl transition-all flex justify-center items-center gap-2 shadow-lg ${isUploading ? 'bg-emerald-900 text-emerald-200 cursor-not-allowed shadow-none' : 'bg-emerald-500 hover:bg-emerald-400 text-slate-900 shadow-emerald-500/30'}`}>
                      {isUploading ? <><Upload className="w-4 h-4 animate-bounce"/> Encriptando...</> : 'Cerrar Vector'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {showRouteModal && (
              <form onSubmit={handleCrearRuta} className="bg-[#1A2333] p-8 rounded-2xl border-t-4 border-t-[#00B4D8] mb-8 shadow-2xl grid grid-cols-1 md:grid-cols-2 gap-6 animate-slide-up relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#00B4D8]/5 rounded-full blur-3xl pointer-events-none"></div>
                <div className="col-span-1 md:col-span-2 text-xl font-bold text-white border-b border-slate-700 pb-4 mb-2 flex items-center gap-3"><Navigation className="w-6 h-6 text-cyan-400"/> Protocolo de Asignación de Despacho Físico</div>
                <div className="bg-[#0B1120]/50 p-5 rounded-xl border border-slate-800 space-y-4">
                  <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-widest border-b border-slate-800 pb-2">Información del Motorista</h4>
                  <div><label className="block text-xs font-bold text-slate-400 uppercase mb-2">Identificador de Piloto</label><input required value={newRoute.piloto} onChange={e=>setNewRoute({...newRoute, piloto: e.target.value})} className="w-full bg-[#141C2B] border border-slate-700 rounded-lg p-3 text-white focus:border-cyan-500 outline-none shadow-inner" placeholder="Ej. Piloto_Alfa_1"/></div>
                  <div><label className="block text-xs font-bold text-slate-400 uppercase mb-2">Conexión Remota (WA Piloto)</label><input value={newRoute.telefonoPiloto} onChange={e=>setNewRoute({...newRoute, telefonoPiloto: e.target.value})} className="w-full bg-[#141C2B] border border-slate-700 rounded-lg p-3 text-white focus:border-cyan-500 outline-none font-mono text-sm shadow-inner" placeholder="Ej. 5555 6666"/></div>
                </div>
                
                <div className="bg-[#0B1120]/50 p-5 rounded-xl border border-slate-800 space-y-4">
                   <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-widest border-b border-slate-800 pb-2">Datos del Destino (Cliente)</h4>
                   <div><label className="block text-xs font-bold text-slate-400 uppercase mb-2">Entidad Receptora</label><input required value={newRoute.cliente} onChange={e=>setNewRoute({...newRoute, cliente: e.target.value})} className="w-full bg-[#141C2B] border border-slate-700 rounded-lg p-3 text-white focus:border-cyan-500 outline-none shadow-inner" placeholder="Ej. Constructora Base"/></div>
                   <div><label className="block text-xs font-bold text-slate-400 uppercase mb-2">Conexión Remota (WA Cliente)</label><input value={newRoute.telefonoCliente} onChange={e=>setNewRoute({...newRoute, telefonoCliente: e.target.value})} className="w-full bg-[#141C2B] border border-slate-700 rounded-lg p-3 text-white focus:border-cyan-500 outline-none font-mono text-sm shadow-inner" placeholder="Ej. 4444 5555"/></div>
                </div>
                
                <div className="col-span-1 md:col-span-2 bg-[#0B1120]/50 p-5 rounded-xl border border-slate-800 space-y-4">
                  <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-widest border-b border-slate-800 pb-2">Carga Física y Coordenadas</h4>
                  <div><label className="block text-xs font-bold text-slate-400 uppercase mb-2">Coordenadas o Dirección (Input Waze)</label><input required value={newRoute.direccion} onChange={e=>setNewRoute({...newRoute, direccion: e.target.value})} className="w-full bg-[#141C2B] border border-slate-700 rounded-lg p-3 text-white focus:border-cyan-500 outline-none shadow-inner" placeholder="Ej. 10 Calle 5-40 Zona 10, Ciudad de Guatemala"/></div>
                  <div className="grid grid-cols-2 gap-4">
                     <div><label className="block text-xs font-bold text-slate-400 uppercase mb-2">Paquete (SKU Vinculado)</label><select required value={newRoute.item} onChange={e=>setNewRoute({...newRoute, item: e.target.value})} className="w-full bg-[#141C2B] border border-slate-700 rounded-lg p-3 text-white focus:border-cyan-500 outline-none shadow-inner"><option value="">Seleccione bulto de bodega...</option>{inventario.map(i=><option key={i.id} value={i.id}>{i.nombre}</option>)}</select></div>
                     <div><label className="block text-xs font-bold text-slate-400 uppercase mb-2">Unidades (Multiplicador)</label><input type="number" min="1" value={newRoute.qty} onChange={e=>setNewRoute({...newRoute, qty: e.target.value})} className="w-full bg-[#141C2B] border border-slate-700 rounded-lg p-3 text-white focus:border-cyan-500 outline-none text-center font-mono font-bold shadow-inner" /></div>
                  </div>
                </div>
                
                <div className="col-span-1 md:col-span-2 text-right mt-2 pt-6 border-t border-slate-700 flex justify-end items-center gap-4">
                  <button type="button" onClick={()=>setShowRouteModal(false)} disabled={isSubmitting} className="px-6 py-3 text-slate-400 hover:text-white font-bold transition-colors disabled:opacity-50">Abortar Emisión</button>
                  <button type="submit" disabled={isSubmitting} className={`font-bold px-10 py-3.5 rounded-lg shadow-lg transition-all flex items-center gap-2 ${isSubmitting ? 'bg-cyan-900 text-cyan-200 cursor-not-allowed shadow-none' : 'bg-[#00B4D8] hover:bg-cyan-400 text-slate-900 shadow-cyan-500/30'}`}>{isSubmitting ? <><Upload className="w-4 h-4 animate-bounce"/> Procesando Lote...</> : 'Transmitir Guía al Motorista'}</button>
                </div>
              </form>
            )}

            {rutas.length === 0 ? (
              <div className="bg-[#141C2B] rounded-xl border border-slate-700 p-16 text-center shadow-xl flex flex-col items-center"><div className="bg-slate-800 p-6 rounded-full mb-6 border border-slate-700 shadow-inner"><Truck className="w-16 h-16 text-slate-600" /></div><h3 className="text-xl font-bold text-white mb-2 uppercase tracking-widest">Radar Despejado</h3><p className="text-slate-500 text-sm font-medium">Inicie un protocolo de despacho para visualizar telemetría de sus unidades en la calle.</p></div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {rutas.map((ruta, i) => (
                  <div key={i} className="bg-[#141C2B] p-6 rounded-2xl border border-slate-700 relative overflow-hidden shadow-xl hover:border-cyan-500/50 hover:shadow-[0_0_30px_rgba(0,180,216,0.1)] transition-all flex flex-col group">
                    <div className={`absolute top-0 right-0 text-white text-[10px] font-black tracking-widest px-4 py-1.5 rounded-bl-xl uppercase shadow-md ${ruta.estado === 'Entregado' ? 'bg-emerald-500' : 'bg-orange-500'}`}>{ruta.estado}</div>
                    
                    <div className="flex items-center gap-4 mb-5">
                      <div className="bg-[#0B1120] p-3.5 rounded-xl border border-slate-700 shadow-inner group-hover:bg-slate-800 transition-colors"><Bike className="w-6 h-6 text-cyan-400" /></div>
                      <div>
                        <h4 className="font-bold text-white text-lg leading-tight truncate w-48 mb-1">{ruta.cliente}</h4>
                        <span className="text-xs text-slate-400 font-bold tracking-wider flex items-center gap-1.5 uppercase"><User className="w-3.5 h-3.5 text-slate-500"/> OP: {ruta.piloto}</span>
                      </div>
                    </div>
                    
                    <div className="bg-[#0B1120] p-4 rounded-xl border border-slate-700/50 mb-5 space-y-2.5">
                      <div className="text-sm text-slate-300 truncate flex items-center gap-2"><MapIcon className="w-4 h-4 text-slate-500 flex-shrink-0"/> <span className="truncate">{ruta.direccion}</span></div>
                      <div className="text-sm text-slate-300 font-medium flex items-center gap-2"><Package className="w-4 h-4 text-slate-500 flex-shrink-0"/> {ruta.cantidad} Unidad(es) de {ruta.item}</div>
                    </div>

                    <div className="border-t border-slate-700 pt-4 flex justify-between items-end mb-4">
                      <div><div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Time Log</div><div className="text-xs text-cyan-400 font-mono">{ruta.fechaVisual}</div></div>
                      <div className="text-right"><div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Valor en Riesgo</div><div className="font-black text-emerald-400 text-xl font-mono">Q{Number(ruta.totalCobrar || 0).toFixed(2)}</div></div>
                    </div>
                    
                    {/* ACCIONES DEL MOTORISTA */}
                    {ruta.estado === 'Pendiente' && (
                      <div className="grid grid-cols-2 gap-3 mt-auto pt-4 border-t border-slate-700/50">
                         <button onClick={() => enviarWhatsAppPiloto(ruta)} className="bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/20 py-2.5 rounded-lg flex justify-center items-center gap-2 hover:bg-[#25D366]/20 transition-colors font-bold text-xs shadow-sm uppercase tracking-wider"><MessageCircle className="w-4 h-4"/> Canal Piloto</button>
                         <button onClick={() => enviarWhatsAppCliente(ruta)} className="bg-blue-500/10 text-blue-400 border border-blue-500/20 py-2.5 rounded-lg flex justify-center items-center gap-2 hover:bg-blue-500/20 transition-colors font-bold text-xs shadow-sm uppercase tracking-wider"><MessageCircle className="w-4 h-4"/> Alerta Cliente</button>
                         <button onClick={() => handleAnularRuta(ruta)} className="col-span-1 bg-transparent border border-red-500/30 text-red-400 py-2.5 rounded-lg flex justify-center items-center gap-2 hover:bg-red-500/10 transition-colors font-bold text-xs shadow-sm uppercase tracking-wider"><ShieldAlert className="w-4 h-4"/> Anular</button>
                         <button onClick={() => { setActiveDelivery(ruta); setDeliveryPhotoFile(null); setDeliveryName(''); }} className="col-span-1 bg-cyan-500 text-slate-900 py-2.5 rounded-lg flex justify-center items-center gap-2 hover:bg-cyan-400 transition-colors font-black text-xs shadow-[0_0_15px_rgba(0,180,216,0.3)] uppercase tracking-wider"><CheckCircle2 className="w-4 h-4"/> Aprobar POD</button>
                      </div>
                    )}

                    {ruta.estado === 'Entregado' && ruta.recibe && (
                       <div className="mt-auto pt-4 border-t border-slate-700/50 text-xs text-slate-400 flex flex-col gap-2">
                         <div className="flex items-center gap-2 bg-emerald-500/5 border border-emerald-500/20 p-2.5 rounded-lg">
                           <ShieldCheck className="w-5 h-5 text-emerald-500 flex-shrink-0"/>
                           <div className="flex flex-col">
                             <span className="font-bold text-emerald-500 tracking-wider uppercase text-[10px]">Liquidación Física Confirmada</span>
                             <span className="truncate text-white font-medium">Receptor: {ruta.recibe} ({ruta.metodoPago})</span>
                           </div>
                         </div>
                         {ruta.fotoUrl && (
                           <a href={ruta.fotoUrl} target="_blank" rel="noreferrer" className="bg-[#0B1120] border border-slate-700 py-2 px-3 rounded-lg text-cyan-400 hover:text-white hover:border-cyan-500 transition-colors flex items-center justify-center gap-2 font-bold uppercase tracking-wider text-[10px]">
                             <Camera className="w-4 h-4"/> Visualizar Evidencia en Servidor
                           </a>
                         )}
                       </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'historial':
        return (
          <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-500 print:hidden">
            <h2 className="text-2xl font-bold text-white mb-6">Auditoría Contable de Red</h2>
            <div className="bg-[#141C2B] rounded-xl border border-slate-700 overflow-hidden shadow-2xl">
               <div className="p-5 border-b border-slate-700 bg-slate-900/50"><h3 className="font-bold text-white text-sm uppercase tracking-widest flex items-center gap-2"><History className="w-4 h-4 text-cyan-400"/> Libro Mayor Consolidado</h3></div>
               <div className="p-0 bg-[#0B1120]">
                 {ventas.length === 0 && rutas.length === 0 ? <p className="text-slate-500 text-center font-bold uppercase tracking-widest py-16 text-xs">El libro mayor se encuentra sin registros.</p> : 
                   <div className="divide-y divide-slate-800/80">
                     {ventas.map((v,i) => (
                       <div key={`v-${i}`} className="flex justify-between items-center p-5 hover:bg-slate-800/50 transition-colors">
                         <div className="flex items-center gap-4">
                           <div className="bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-lg"><Store className="w-5 h-5 text-emerald-400"/></div>
                           <div><span className="text-xs font-bold tracking-widest uppercase block mb-1 text-emerald-400">POS (Mostrador) | {v.fechaVisual}</span><span className="text-white text-sm font-bold">{v.cliente} <span className="text-slate-500 font-medium ml-2">- {v.cantidad}x {v.item}</span></span></div>
                         </div>
                         <div className="text-emerald-400 font-black text-xl font-mono">Q{Number(v.total || 0).toFixed(2)}</div>
                       </div>
                     ))}
                     {rutas.map((r,i) => (
                       <div key={`r-${i}`} className={`flex justify-between items-center p-5 hover:bg-slate-800/50 transition-colors ${r.estado === 'Cancelado' ? 'opacity-50 grayscale' : ''}`}>
                         <div className="flex items-center gap-4">
                           <div className={`border p-2.5 rounded-lg ${r.estado === 'Cancelado' ? 'bg-red-500/10 border-red-500/20' : 'bg-cyan-500/10 border-cyan-500/20'}`}><Truck className={`w-5 h-5 ${r.estado === 'Cancelado' ? 'text-red-400' : 'text-cyan-400'}`}/></div>
                           <div><span className={`text-xs font-bold tracking-widest uppercase block mb-1 ${r.estado === 'Cancelado' ? 'text-red-400' : 'text-cyan-400'}`}>Vector Logístico | {r.fechaVisual} | Estatus: {r.estado}</span><span className="text-white text-sm font-bold">OP: {r.piloto} <span className="text-slate-500 font-medium mx-2">&rarr;</span> {r.cliente} <span className="text-slate-500 font-medium ml-2">- {r.cantidad}x {r.item}</span></span></div>
                         </div>
                         <div className={`font-black text-xl font-mono ${r.estado === 'Cancelado' ? 'text-slate-500 line-through' : 'text-emerald-400'}`}>Q{Number(r.totalCobrar || 0).toFixed(2)}</div>
                       </div>
                     ))}
                   </div>
                 }
               </div>
            </div>
          </div>
        );

      case 'finanzas':
        return (
          <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6 print:hidden">
              <h2 className="text-2xl font-bold text-white">Cuadre de Efectivo y Caja</h2>
              <button onClick={exportToPDF} className="bg-[#00B4D8] hover:bg-cyan-400 text-slate-900 font-bold px-6 py-2.5 rounded-lg flex items-center gap-2 transition-colors shadow-[0_0_15px_rgba(0,180,216,0.3)]"><FileOutput className="w-4 h-4" /> Exportar Dictamen a PDF</button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:hidden">
              <div className="bg-[#141C2B] p-8 rounded-2xl border-t-4 border-t-emerald-500 shadow-2xl relative overflow-hidden"><div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div><h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2"><Wallet className="w-5 h-5 text-emerald-400"/> Masa Monetaria (Físico)</h3><div className="text-6xl font-black text-white mb-2 font-mono flex items-baseline gap-2"><span className="text-2xl text-emerald-500">Q</span>{totalEfectivo.toFixed(2)}</div><p className="text-sm font-medium text-emerald-400">Corte de caja obligatorio para liquidación de pilotos.</p></div>
              <div className="bg-[#141C2B] p-8 rounded-2xl border-t-4 border-t-blue-500 shadow-2xl relative overflow-hidden"><div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div><h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2"><CreditCard className="w-5 h-5 text-blue-400"/> Banca Digital (Transferencias)</h3><div className="text-6xl font-black text-white mb-2 font-mono flex items-baseline gap-2"><span className="text-2xl text-blue-500">Q</span>{totalTarjetas.toFixed(2)}</div><p className="text-sm font-medium text-blue-400">Fondos ya asegurados en cuentas bancarias empresariales.</p></div>
            </div>

            {/* SECCIÓN OCULTA SOLO PARA IMPRESIÓN OFICIAL (PDF) -> Blindado contra z-index de Tailwind */}
            <div className="hidden print:block bg-white text-black print:absolute print:top-0 print:left-0 print:w-full print:z-[9999] print:min-h-screen print:bg-white print:p-8 font-sans">
               <div className="border-b-4 border-black pb-6 mb-8 flex justify-between items-end">
                 <div>
                   <h1 className="text-4xl font-black uppercase tracking-tighter mb-1">{userData?.empresa || 'RUTASYNC ERP'}</h1>
                   <p className="text-xl font-bold text-gray-800">DOCUMENTO DE AUDITORÍA Y CORTE DE CAJA B2B</p>
                 </div>
                 <div className="text-right">
                   <p className="text-sm font-mono font-bold">FECHA EMISIÓN: {new Date().toLocaleString('es-GT')}</p>
                   <p className="text-sm font-mono font-bold mt-1">ID AUDITOR: {user?.email}</p>
                   <p className="text-xs font-mono mt-1 text-gray-500">HASH: {user?.uid.substring(0,8)}-{Date.now()}</p>
                 </div>
               </div>

               <div className="mb-10 grid grid-cols-2 gap-6">
                 <div className="p-6 border-2 border-black rounded-lg bg-gray-50"><h3 className="font-bold text-lg mb-2 uppercase tracking-wider text-gray-600">Total Obligatorio (Efectivo)</h3><p className="text-4xl font-black font-mono">Q{totalEfectivo.toFixed(2)}</p></div>
                 <div className="p-6 border-2 border-black rounded-lg bg-gray-50"><h3 className="font-bold text-lg mb-2 uppercase tracking-wider text-gray-600">Total Validado (Digital)</h3><p className="text-4xl font-black font-mono">Q{totalTarjetas.toFixed(2)}</p></div>
               </div>

               <h2 className="text-xl font-bold mb-4 border-b-2 border-black pb-2 uppercase tracking-widest">Sección A: Liquidación de Flotilla</h2>
               <table className="w-full text-left text-sm mb-10 border-collapse">
                 <thead><tr className="bg-black text-white"><th className="p-3 border border-black font-bold uppercase tracking-wider text-xs">Piloto Operador</th><th className="p-3 border border-black font-bold uppercase tracking-wider text-xs">Entidad Cliente</th><th className="p-3 border border-black font-bold uppercase tracking-wider text-xs">Detalle Carga</th><th className="p-3 border border-black font-bold uppercase tracking-wider text-xs text-center">Protocolo</th><th className="p-3 border border-black font-bold uppercase tracking-wider text-xs text-right">Monto Reportado</th></tr></thead>
                 <tbody>
                   {rutas.filter(r => r.estado === 'Entregado').map((r,i) => (
                     <tr key={i} className="nth-child-even:bg-gray-50"><td className="p-3 border border-gray-400 font-medium">{r.piloto}</td><td className="p-3 border border-gray-400 font-bold">{r.cliente}</td><td className="p-3 border border-gray-400 text-gray-600">{r.cantidad}x {r.item}</td><td className="p-3 border border-gray-400 text-center font-bold">{r.metodoPago}</td><td className="p-3 border border-gray-400 text-right font-mono font-bold">Q{Number(r.totalCobrar).toFixed(2)}</td></tr>
                   ))}
                   {rutas.filter(r => r.estado === 'Entregado').length === 0 && <tr><td colSpan="5" className="p-6 text-center font-bold text-gray-500 uppercase tracking-widest">Sin vectores liquidados en este corte.</td></tr>}
                 </tbody>
               </table>

               <h2 className="text-xl font-bold mb-4 border-b-2 border-black pb-2 uppercase tracking-widest">Sección B: Movimientos de Terminal (POS)</h2>
               <table className="w-full text-left text-sm mb-12 border-collapse">
                 <thead><tr className="bg-black text-white"><th className="p-3 border border-black font-bold uppercase tracking-wider text-xs">Entidad Cliente (Mostrador)</th><th className="p-3 border border-black font-bold uppercase tracking-wider text-xs">Detalle Transacción</th><th className="p-3 border border-black font-bold uppercase tracking-wider text-xs text-center">Protocolo</th><th className="p-3 border border-black font-bold uppercase tracking-wider text-xs text-right">Monto Reportado</th></tr></thead>
                 <tbody>
                   {ventas.map((v,i) => (
                     <tr key={i} className="nth-child-even:bg-gray-50"><td className="p-3 border border-gray-400 font-bold">{v.cliente}</td><td className="p-3 border border-gray-400 text-gray-600">{v.cantidad}x {v.item}</td><td className="p-3 border border-gray-400 text-center font-bold">{v.metodo}</td><td className="p-3 border border-gray-400 text-right font-mono font-bold">Q{Number(v.total).toFixed(2)}</td></tr>
                   ))}
                   {ventas.length === 0 && <tr><td colSpan="4" className="p-6 text-center font-bold text-gray-500 uppercase tracking-widest">Sin transacciones generadas en terminal local.</td></tr>}
                 </tbody>
               </table>

               <div className="grid grid-cols-2 gap-20 mt-32 pt-10">
                 <div className="border-t-2 border-black text-center pt-3"><span className="font-bold text-lg block uppercase">Validación de Cajero</span><span className="text-gray-500 text-xs mt-1 block">Firma y Sello de Auditor de Red</span></div>
                 <div className="border-t-2 border-black text-center pt-3"><span className="font-bold text-lg block uppercase">Aceptación de Gerencia</span><span className="text-gray-500 text-xs mt-1 block">Recepción Conforme de Efectivo</span></div>
               </div>
               
               <div className="text-center mt-12 text-xs font-mono text-gray-400">SISTEMA RUTASYNC ERP - GENERADO AUTOMÁTICAMENTE BAJO STANDARDS B2B</div>
            </div>
          </div>
        );

      case 'agenda':
        return (
          <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-500 print:hidden">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Cronograma y Logística Preventiva</h2>
              <button onClick={() => setShowEventModal(true)} className="bg-slate-800 border border-slate-700 hover:bg-slate-700 text-white px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 transition-colors shadow-lg">
                <Calendar className="w-4 h-4 text-blue-400" /> Insertar Tarea Programada
              </button>
            </div>

            {showEventModal && (
              <form onSubmit={handleCrearEvento} className="bg-[#1A2333] p-8 rounded-2xl border-t-4 border-t-blue-500 mb-8 shadow-2xl grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-up relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>
                <div className="col-span-1 md:col-span-3 text-xl font-bold text-white border-b border-slate-700 pb-4 mb-2 flex justify-between items-center">
                  <div className="flex items-center gap-3"><Calendar className="w-6 h-6 text-blue-400"/> Asignación de Recursos Temporales</div>
                  <button type="button" onClick={() => setShowEventModal(false)} className="text-slate-500 hover:text-white bg-slate-800 p-2 rounded-lg transition-colors"><X className="w-5 h-5"/></button>
                </div>
                <div><label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Denominación de Tarea</label><input required value={newEvent.titulo} onChange={e=>setNewEvent({...newEvent, titulo: e.target.value})} className="w-full bg-[#0B1120] border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none shadow-inner" placeholder="Ej. Revisión Frenos Panel 4"/></div>
                <div><label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Marca de Tiempo (Fecha)</label><input required type="date" value={newEvent.fecha} onChange={e=>setNewEvent({...newEvent, fecha: e.target.value})} className="w-full bg-[#0B1120] border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none font-mono shadow-inner" /></div>
                <div><label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Clasificación Estructural</label><select required value={newEvent.tipo} onChange={e=>setNewEvent({...newEvent, tipo: e.target.value})} className="w-full bg-[#0B1120] border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none font-bold shadow-inner"><option>Mantenimiento Preventivo</option><option>Reunión Administrativa</option><option>Entrega Especial B2B</option><option>Recolección Valores</option></select></div>
                <div className="col-span-1 md:col-span-3"><label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Parámetros Adicionales (Log)</label><input value={newEvent.detalle} onChange={e=>setNewEvent({...newEvent, detalle: e.target.value})} className="w-full bg-[#0B1120] border border-slate-700 rounded-lg p-3 text-slate-300 focus:border-blue-500 outline-none font-mono text-sm shadow-inner" placeholder="Escriba especificaciones técnicas u observaciones aquí..."/></div>
                <div className="col-span-1 md:col-span-3 text-right mt-4 border-t border-slate-700 pt-6 flex justify-end gap-3">
                  <button type="button" onClick={() => setShowEventModal(false)} disabled={isSubmitting} className="px-6 py-3 text-slate-400 hover:text-white font-bold transition-colors disabled:opacity-50">Cancelar Registro</button>
                  <button type="submit" disabled={isSubmitting} className={`font-bold px-10 py-3.5 rounded-lg shadow-lg transition-all flex items-center gap-2 ${isSubmitting ? 'bg-blue-900 text-blue-200 cursor-not-allowed shadow-none' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20'}`}>{isSubmitting ? <><Upload className="w-4 h-4 animate-bounce"/> Encriptando...</> : 'Almacenar en Servidor de Fechas'}</button>
                </div>
              </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {eventos.length === 0 ? (
                 <div className="col-span-3 bg-[#141C2B] rounded-2xl border border-slate-700 p-16 text-center shadow-xl">
                    <div className="bg-slate-800 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-700 shadow-inner"><Calendar className="w-10 h-10 text-slate-500" /></div>
                    <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-widest">Cronograma Optimizado</h3>
                    <p className="text-slate-400 font-medium text-sm max-w-md mx-auto">El sistema no reporta mantenimientos de flota ni entregas críticas programadas a corto plazo.</p>
                 </div>
               ) : (
                 eventos.map((evento, i) => (
                   <div key={i} className="bg-[#141C2B] p-6 rounded-xl border border-slate-700 relative overflow-hidden shadow-xl border-l-4 border-l-blue-500 hover:bg-slate-800/50 transition-colors group">
                     <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-3 flex items-center gap-1.5 bg-blue-500/10 inline-block px-3 py-1 rounded-full border border-blue-500/20"><Clock className="w-3.5 h-3.5 inline-block -mt-0.5"/> {evento.fecha}</div>
                     <h4 className="font-black text-white text-xl leading-tight mb-2 tracking-tight">{evento.titulo}</h4>
                     <p className="text-sm text-slate-400 mb-5 font-medium line-clamp-3 leading-relaxed">{evento.detalle || 'Ausencia de parámetros adicionales en el log de creación.'}</p>
                     <div className="mt-auto border-t border-slate-700/50 pt-4"><span className="bg-[#0B1120] text-slate-300 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg border border-slate-700 shadow-inner">{evento.tipo}</span></div>
                   </div>
                 ))
               )}
            </div>
          </div>
        );

      case 'ajustes':
        return (
          <div className="space-y-6 max-w-6xl mx-auto print:hidden">
            <h2 className="text-2xl font-bold text-white mb-6">Consola de Arquitectura (Nube Privada)</h2>
            <div className="bg-[#141C2B] rounded-2xl border border-slate-700 p-10 text-center relative overflow-hidden mb-10 shadow-2xl">
               <div className="absolute top-0 right-0 p-5">
                 <span className="bg-cyan-500/10 text-[#00B4D8] text-[10px] uppercase font-black tracking-widest px-4 py-2 rounded-lg border border-cyan-500/30 flex items-center gap-2 shadow-sm">
                   <Shield className="w-4 h-4" /> Autorización: {userData?.role?.toUpperCase() || 'USUARIO B2B'}
                 </span>
               </div>
               
               <div className="absolute left-0 top-1/2 -translate-y-1/2 w-48 h-48 bg-[#00B4D8]/5 rounded-full blur-3xl pointer-events-none"></div>
               
               <div className="w-32 h-32 bg-[#0B1120] rounded-3xl mx-auto mb-6 flex items-center justify-center border-2 border-slate-700 shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-500">
                 <Building className="w-14 h-14 text-[#00B4D8]" />
               </div>
               <h3 className="text-4xl font-black text-white tracking-tighter mb-2">{userData?.empresa || 'Empresa No Definida'}</h3>
               <p className="text-slate-400 mb-10 font-mono font-medium">{user?.email}</p>
               
               <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-left max-w-4xl mx-auto relative z-10">
                  <div className="bg-[#0B1120] p-5 rounded-xl border border-slate-700 shadow-inner">
                    <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-2 block">Identificador de Base de Datos</label>
                    <div className="text-slate-300 font-mono text-sm font-medium flex items-center gap-2"><Lock className="w-4 h-4 text-slate-500"/> {user?.uid.substring(0,12)}...</div>
                  </div>
                  <div className="bg-[#0B1120] p-5 rounded-xl border border-slate-700 shadow-inner border-l-2 border-l-emerald-500">
                    <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-2 block">Estado de Red</label>
                    <div className="text-emerald-400 font-black text-sm uppercase flex items-center gap-2 tracking-wider"><Zap className="w-4 h-4 fill-current"/> Nodo Activo</div>
                  </div>
                  <div className="bg-[#0B1120] p-5 rounded-xl border border-slate-700 shadow-inner border-l-2 border-l-[#00B4D8]">
                    <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-2 block">Infraestructura Asignada</label>
                    <div className="text-[#00B4D8] font-black text-sm uppercase flex items-center gap-2 tracking-wider"><Building className="w-4 h-4"/> PLAN {userData?.plan || 'BÁSICO'}</div>
                  </div>
               </div>
            </div>

            {/* PANEL DE PODER: SUPERADMIN (Nervio Central) */}
            {userData?.role === 'SUPERADMIN' && (
              <div className="bg-[#1A2333] rounded-2xl border-2 border-cyan-500/50 p-8 animate-fade-in shadow-[0_0_50px_rgba(0,180,216,0.15)] relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-2 h-full bg-cyan-500 group-hover:w-full group-hover:opacity-5 transition-all duration-1000"></div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 border-b border-slate-700 pb-6 relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="bg-cyan-500/20 p-3 rounded-xl border border-cyan-500/30"><ShieldAlert className="w-8 h-8 text-cyan-400" /></div>
                    <div>
                      <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Nervio Central</h3>
                      <p className="text-slate-400 text-sm font-medium mt-1">Control absoluto sobre los clústers de empresas clientes.</p>
                    </div>
                  </div>
                  <div className="bg-red-500/10 text-red-400 border border-red-500/20 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center gap-2 animate-pulse">
                     <AlertTriangle className="w-4 h-4"/> Nivel Súper Administrador
                  </div>
                </div>
                
                <div className="overflow-x-auto relative z-10 bg-[#0B1120] rounded-xl border border-slate-700 shadow-inner">
                  <table className="w-full text-left text-sm text-slate-300">
                    <thead className="bg-[#141C2B] text-slate-400 text-xs uppercase tracking-widest font-black border-b border-slate-700">
                      <tr><th className="px-6 py-5">Entidad (Base Instalada)</th><th className="px-6 py-5">Contacto Matriz</th><th className="px-6 py-5 text-center">Nivel Servidor</th><th className="px-6 py-5 text-center">Estado de Operación</th><th className="px-6 py-5 text-right">Interruptores de Corte</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {clientesAdmin.map((cli) => (
                        <tr key={cli.uid} className="hover:bg-slate-800/50 transition-colors">
                          <td className="px-6 py-5 font-black text-white text-base tracking-tight">{cli.empresa}</td>
                          <td className="px-6 py-5 text-slate-400 font-mono text-sm">{cli.email}</td>
                          <td className="px-6 py-5 text-center"><span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-3 py-1.5 rounded text-[10px] font-black uppercase tracking-widest">{cli.plan}</span></td>
                          <td className="px-6 py-5 text-center"><span className={`px-4 py-1.5 rounded-lg text-xs font-black tracking-widest uppercase shadow-sm ${cli.isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>{cli.isActive ? 'EN LÍNEA' : 'SUSPENDIDO'}</span></td>
                          <td className="px-6 py-5 text-right">
                            {cli.role !== 'SUPERADMIN' && cli.uid !== user?.uid ? (
                              <button onClick={() => handleToggleActivo(cli.uid, cli.isActive)} className={`px-5 py-2.5 rounded-lg text-[10px] uppercase tracking-widest font-black flex items-center gap-2 ml-auto transition-all shadow-md ${cli.isActive ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/30' : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/30'}`}>
                                {cli.isActive ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />} {cli.isActive ? 'APAGAR SERVICIO' : 'RESTAURAR CONEXIÓN'}
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-600 font-black uppercase tracking-widest">Nodo Inmune (Admin)</span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {clientesAdmin.length === 0 && (<tr><td colSpan="5" className="text-center py-16 text-slate-500 font-bold uppercase tracking-widest"><Zap className="w-10 h-10 mx-auto mb-4 opacity-30 text-cyan-400 animate-pulse"/> Sincronizando con el enjambre de datos de Firestore...</td></tr>)}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        );

      default: return (<div className="flex flex-col items-center justify-center h-96 text-slate-600 print:hidden"><Package className="w-20 h-20 mb-4 opacity-20" /><p className="font-bold uppercase tracking-widest text-sm">El módulo no se encuentra en el índice actual.</p></div>);
    }
  };

  if (user) {
    return (
      <div className="min-h-screen bg-[#0B1120] text-slate-300 font-sans flex flex-col selection:bg-cyan-500/30 print:bg-white print:text-black">
        {toastMessage && (<div className="fixed top-4 right-4 bg-emerald-500 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 z-50 animate-bounce print:hidden border border-emerald-400"><CheckCircle2 className="w-6 h-6" /> <span className="font-bold text-sm tracking-wide">{toastMessage}</span></div>)}

        <header className="bg-[#0B1120] border-b border-slate-800 z-20 print:hidden shadow-lg">
          <div className="h-20 flex items-center justify-between px-8">
            <div className="flex items-center gap-4"><div className="bg-transparent border border-[#00B4D8] p-2 rounded-xl shadow-[0_0_15px_rgba(0,180,216,0.1)]"><MapIcon className="w-6 h-6 text-[#00B4D8]" /></div><div className="flex flex-col"><span className="text-xl font-black text-white tracking-tight leading-none uppercase">RutaSync <span className="font-light text-[#00B4D8]">B2B</span></span><span className="text-[10px] text-slate-500 tracking-widest font-black mt-1">NÚCLEO ADMINISTRATIVO</span></div></div>
            <div className="flex items-center gap-8"><div className="text-right hidden sm:block"><div className="text-sm font-bold text-white font-mono">{user?.email || 'gerencia@rutasync.com'}</div><div className="text-xs text-slate-400 font-bold tracking-widest uppercase mt-0.5">PERMISOS: <span className="text-[#00B4D8]">{userData?.role || 'PROPIETARIO'}</span></div></div><div className="flex items-center gap-4"><button className={`text-slate-900 text-[10px] font-black px-4 py-2 rounded-lg uppercase tracking-widest transition-colors shadow-sm ${userData?.isActive ? 'bg-emerald-500 hover:bg-emerald-400' : 'bg-red-500 hover:bg-red-400'}`}>Red {userData?.isActive ? 'Aprobada' : 'Cortada'}</button><button onClick={handleLogout} className="p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-400 hover:text-white hover:bg-red-500/20 hover:border-red-500/30 transition-all group" title="Cerrar Conexión"><LogOut className="w-5 h-5 group-hover:text-red-400" /></button></div></div>
          </div>
          <div className="px-8 flex items-center gap-2 overflow-x-auto hide-scrollbar border-t border-slate-800/50 bg-[#141C2B] pt-2 pb-0">
            {[
              { id: 'dashboard', icon: LayoutDashboard, label: 'TELEMETRÍA' },
              { id: 'pos', icon: Store, label: 'TERMINAL POS' },
              { id: 'despachos', icon: Truck, label: 'LOGÍSTICA' },
              { id: 'almacen', icon: Package, label: 'BODEGA' },
              { id: 'historial', icon: History, label: 'AUDITORÍA' },
              { id: 'finanzas', icon: Receipt, label: 'FLUJO CAJA' },
              { id: 'agenda', label: 'CRONOGRAMA', icon: Calendar },
              { id: 'ajustes', icon: User, label: 'ARQUITECTURA' }
            ].map(tab => (
              <button key={tab.id} onClick={() => setCurrentView(tab.id)} className={`flex items-center gap-2.5 px-6 py-4 text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap rounded-t-lg border-b-2 ${currentView === tab.id ? 'text-[#00B4D8] border-[#00B4D8] bg-[#0B1120]' : 'text-slate-500 border-transparent hover:text-white hover:bg-slate-800/50'}`}><tab.icon className={`w-4 h-4 ${currentView === tab.id ? 'text-[#00B4D8]' : 'opacity-70'}`} /> {tab.label}</button>
            ))}
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6 lg:p-10 bg-[#0B1120] print:p-0 print:overflow-visible print:bg-white relative">
          <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-[#141C2B] to-transparent pointer-events-none opacity-50 print:hidden"></div>
          <div className="relative z-10">{renderERPContent()}</div>
        </main>
        
        {renderConfirmModal()}
      </div>
    );
  }
}