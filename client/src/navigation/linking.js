import * as Linking from 'expo-linking';

const linking = {
  prefixes: [Linking.createURL('/'), 'http://localhost:8081', 'http://localhost:19006'],
  config: {
    screens: {
      Auth: {
        path: 'auth',
        screens: {
          Login: 'login',
          Register: 'registro',
          ForgotPassword: 'recuperar-clave',
        },
      },
      UserApp: {
        path: 'usuario',
        screens: {
          Home: 'inicio',
          Earn: 'ganar',
          Benefits: 'beneficios',
          Historial: 'historial',
          Profile: 'ajustes',
        },
      },
      AdminApp: {
        path: 'admin',
        screens: {
          AdminDashboard: 'dashboard',
          Missions: 'misiones',
          Benefits: 'beneficios',
          Approvals: 'solicitudes',
          Users: 'usuarios',
          Audit: 'auditoria',
          Settings: 'ajustes',
        },
      },
      MerchantApp: {
        path: 'comercio',
        screens: {
          Dashboard: 'dashboard',
          Benefits: 'beneficios',
          Scanner: 'escaner',
          History: 'historial',
          Profile: 'ajustes',
        },
      },
      ChangePassword: 'cambiar-contrasena',
    },
  },
};

export default linking;
