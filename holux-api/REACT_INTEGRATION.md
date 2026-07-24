# Guía de Conexión del Frontend React con Laravel API (Expandida)

Sigue esta guía detallada para conectar tu aplicación React de **HOLUX** con el backend Laravel y Supabase Auth.

---

## 1. Configuración de Variables de Entorno en React

Crea o edita el archivo `.env` en la raíz de tu proyecto React:

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_SUPABASE_URL=https://<tu-proyecto-supabase>.supabase.co
VITE_SUPABASE_ANON_KEY=<tu-anon-key-de-supabase>
```

---

## 2. Autenticación con Supabase Auth (En el Frontend)

El registro e inicio de sesión se realizan llamando directamente a la API de Supabase Auth desde React, guardando el token devuelto para mandarlo a Laravel.

### A. Registro (Signup)
Formulario de registro enviando email, contraseña y metadata (nombre y teléfono):

```javascript
const handleRegister = async (email, password, fullName, phone) => {
  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/auth/v1/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
    },
    body: JSON.stringify({
      email,
      password,
      options: {
        data: { // Se guardan en raw_user_meta_data y el trigger sincroniza en public.profiles
          full_name: fullName,
          phone: phone
        }
      }
    })
  });
  
  const data = await response.json();
  if (!response.ok) throw new Error(data.msg || 'Error en el registro');
  alert('Registro exitoso. Revisa tu email para confirmar cuenta.');
};
```

### B. Inicio de Sesión (Login)
Formulario de login para obtener el `access_token` (JWT):

```javascript
const handleLogin = async (email, password) => {
  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
    },
    body: JSON.stringify({ email, password })
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error_description || 'Error de credenciales');

  // Guarda en el estado global de React (ej: Context)
  const token = data.access_token;
  const user = data.user; 
  
  // Ahora consultamos los datos del perfil local (que nos dirá el rol: customer o admin)
  const profile = await fetchProfile(token);
  return { token, user, profile };
};
```

> [!IMPORTANT]
> Guarda el `token` en memoria (State / Context) y adjuntalo en el header `Authorization: Bearer <token>` en cada consulta protegida a Laravel.

---

## 3. Consultas del Cliente (Requieren Token Bearer)

Crea una función auxiliar para realizar peticiones autenticadas a Laravel:

```javascript
const apiFetch = async (endpoint, token, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };

  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api${endpoint}`, {
    ...options,
    headers: { ...headers, ...options.headers }
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Error en la petición');
  return data;
};
```

### A. Sub-sección "Mis datos"
Obtención e intercambio de datos personales del perfil:

```javascript
// Obtener perfil logueado
const fetchProfile = (token) => apiFetch('/me', token);

// Editar perfil logueado
const updateProfile = (token, fullName, phone) => {
  return apiFetch('/me', token, {
    method: 'PATCH',
    body: JSON.stringify({ full_name: fullName, phone })
  });
};
```

### B. Sub-sección "Mis direcciones"
CRUD de direcciones de entrega del cliente:

```javascript
// Listar direcciones
const getAddresses = (token) => apiFetch('/me/addresses', token);

// Crear dirección
const saveAddress = (token, address) => {
  return apiFetch('/me/addresses', token, {
    method: 'POST',
    body: JSON.stringify(address) // { label, street, city, province, postal_code, is_default }
  });
};

// Editar dirección
const updateAddress = (token, id, address) => {
  return apiFetch(`/me/addresses/${id}`, token, {
    method: 'PATCH',
    body: JSON.stringify(address)
  });
};

// Borrar dirección
const deleteAddress = (token, id) => {
  return apiFetch(`/me/addresses/${id}`, token, { method: 'DELETE' });
};
```

### C. Sub-sección "Mis pedidos"
Visualización y cancelación de órdenes propias:

```javascript
// Listar historial de pedidos
const getMyOrders = (token) => apiFetch('/me/orders', token);

// Obtener detalle de pedido propio
const getMyOrderDetail = (token, id) => apiFetch(`/me/orders/${id}`, token);

// Cancelar pedido propio (disponible solo si status === 'pending')
const cancelMyOrder = (token, id) => apiFetch(`/me/orders/${id}/cancel`, token, { method: 'POST' });

// Descargar Ticket en PDF
const downloadTicket = (token, orderId) => {
  window.open(`${import.meta.env.VITE_API_BASE_URL}/api/me/orders/${orderId}/ticket?token=${token}`, '_blank');
};
```
> [!TIP]
> En la descarga de PDF, si es un enlace `GET` tradicional en el navegador, podés pasar el token como query param en la URL y el middleware de Laravel `VerifySupabaseToken` lo leerá automáticamente.

---

## 4. Sección de Reseñas de Producto

### A. Obtener reseñas y rating promedio (Público)
```javascript
const fetchProductReviews = async (productId) => {
  const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/products/${productId}/reviews`);
  return await res.json(); // retorna { reviews: [], rating_average, total_reviews }
};
```

### B. Dejar reseña (Requiere Login)
```javascript
const addReview = (token, productId, rating, comment) => {
  return apiFetch(`/products/${productId}/reviews`, token, {
    method: 'POST',
    body: JSON.stringify({ rating, comment })
  });
};
```

---

## 5. Panel de Administrador (Requiere `profile.role === 'admin'`)

Todas las llamadas a endpoints de administración deben pasar el token del admin en el header.

### A. Métricas del Dashboard
Trae ventas totales, pedidos por estado y top productos:
```javascript
const getDashboardStats = (token) => apiFetch('/admin/dashboard', token);
```

### B. Gestión de Pedidos
```javascript
// Listar todos los pedidos de todos los clientes
const getAllOrders = (token) => apiFetch('/admin/orders', token);

// Ver detalle de cualquier pedido
const getOrderDetailAdmin = (token, id) => apiFetch(`/admin/orders/${id}`, token);

// Actualizar estado del pedido (pending, processing, completed, cancelled)
const updateOrderStatus = (token, id, status) => {
  return apiFetch(`/admin/orders/${id}`, token, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });
};

// Descargar Ticket PDF desde admin
const downloadTicketAdmin = (token, orderId) => {
  window.open(`${import.meta.env.VITE_API_BASE_URL}/api/admin/orders/${orderId}/ticket?token=${token}`, '_blank');
};
```

### C. Gestión de Clientes (Desactivar Cuentas)
```javascript
// Listar todos los clientes registrados
const getAllCustomers = (token) => apiFetch('/admin/customers', token);

// Activar o desactivar cuenta de un cliente
const toggleCustomerActive = (token, customerId, activeStatus) => {
  return apiFetch(`/admin/customers/${customerId}`, token, {
    method: 'PATCH',
    body: JSON.stringify({ active: activeStatus })
  });
};
```

### D. Promover Administradores
```javascript
// Promover usuario registrado a rol Admin
const promoteToAdmin = (token, userId) => {
  return apiFetch('/admin/admins', token, {
    method: 'POST',
    body: JSON.stringify({ user_id: userId })
  });
};
```

### E. Moderación de Reseñas
```javascript
// Listar todas las reseñas
const getAllReviewsAdmin = (token) => apiFetch('/admin/reviews', token);

// Aprobar o rechazar reseña (approved true/false)
const moderateReview = (token, id, approved) => {
  return apiFetch(`/admin/reviews/${id}`, token, {
    method: 'PATCH',
    body: JSON.stringify({ approved })
  });
};

// Eliminar reseña
const deleteReviewAdmin = (token, id) => {
  return apiFetch(`/admin/reviews/${id}`, token, { method: 'DELETE' });
};
```
