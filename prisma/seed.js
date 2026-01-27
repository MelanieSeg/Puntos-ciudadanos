import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed de la base de datos...');

  try {
    // Limpiar datos existentes en orden correcto (respetando foreign keys)
    // Primero: modelos que dependen de otros
    try {
      await prisma.benefitRedemption.deleteMany();
    } catch (e) {
      // Tabla no existe aún
    }
    try {
      await prisma.missionCompletion.deleteMany();
    } catch (e) {
      // Tabla no existe aún
    }
    try {
      await prisma.pointTransaction.deleteMany();
    } catch (e) {
      // Tabla no existe aún
    }
    
    // Luego: modelos independientes
    try {
      await prisma.missionSubmission.deleteMany();
    } catch (e) {
      // Tabla no existe aún
    }
    try {
      await prisma.mission.deleteMany();
    } catch (e) {
      // Tabla no existe aún
    }
    try {
      await prisma.benefit.deleteMany();
    } catch (e) {
      // Tabla no existe aún
    }
    try {
      await prisma.merchantProfile.deleteMany();
    } catch (e) {
      // Tabla no existe aún
    }
    try {
      await prisma.wallet.deleteMany();
    } catch (e) {
      // Tabla no existe aún
    }
    try {
      await prisma.user.deleteMany();
    } catch (e) {
      // Tabla no existe aún
    }
    
    console.log('Datos anteriores eliminados correctamente');

    // ============================================
    // CREAR USUARIOS
    // ============================================
    
    const passwordHash = await bcrypt.hash('Master@2025', 12);
    
    // ADMIN MASTER
    const masterAdmin = await prisma.user.create({
      data: {
        name: 'Master Admin',
        email: 'master@puntos-ciudadanos.com',
        passwordHash,
        role: 'MASTER_ADMIN',
        status: 'ACTIVE',
        emailVerified: true, // Master admin pre-verificado
        mustChangePassword: false, // No requiere cambio (contraseña definitiva)
        wallet: {
          create: {
            balance: 0,
          },
        },
      },
    });
    
    console.log('Master: master@puntos-ciudadanos.com / Master@2025');

    const userPasswordHash = await bcrypt.hash('user123', 12);
    
    // Usuario 1 - María
    const user1 = await prisma.user.create({
      data: {
        name: 'María González',
        email: 'maria@example.com',
        passwordHash: userPasswordHash,
        role: 'USER',
        status: 'ACTIVE',
        emailVerified: true,
        wallet: {
          create: {
            balance: 450,
          },
        },
      },
      include: {
        wallet: true,
      },
    });

    // Usuario 2 - Juan
    const user2 = await prisma.user.create({
      data: {
        name: 'Juan Pérez',
        email: 'juan@example.com',
        passwordHash: userPasswordHash,
        role: 'USER',
        status: 'ACTIVE',
        emailVerified: true,
        wallet: {
          create: {
            balance: 300,
          },
        },
      },
      include: {
        wallet: true,
      },
    });

    console.log('Usuarios ciudadanos creados con sus wallets');

    // Usuario Comercio - Mati Mechada
    const merchantPasswordHash = await bcrypt.hash('merchant123', 12);
    
    const merchant = await prisma.user.create({
      data: {
        name: 'Mati Mechada',
        email: 'mati@mechada.com',
        passwordHash: merchantPasswordHash,
        role: 'MERCHANT',
        status: 'ACTIVE',
        emailVerified: true, // Merchant del seed pre-verificado
        mustChangePassword: false, // No requiere cambio (contraseña definitiva)
        wallet: {
          create: {
            balance: 0,
          },
        },
        merchantProfile: {
          create: {
            storeName: 'Fuente de Soda Mati Mechada',
            address: 'Av. Providencia 1234, Santiago',
            phone: '+56987654321',
            rut: '76.543.210-K'
          }
        },
      },
      include: {
        wallet: true,
      },
    });

    console.log('Comercio de prueba creado (Mati Mechada)');

    // ============================================
    // CREAR BENEFICIOS
    // ============================================

    const benefits = await Promise.all([
      prisma.benefit.create({
        data: {
          merchantId: merchant.id,
          title: 'Descuento 20% en Compras',
          description: 'Obtén un 20% de descuento en todas tus compras en nuestra tienda',
          pointsCost: 100,
          stock: 50,
          active: true,
          category: 'DESCUENTO',
        },
      }),
      prisma.benefit.create({
        data: {
          merchantId: merchant.id,
          title: 'Café Gratis',
          description: 'Disfruta de un café americano o espresso totalmente gratis',
          pointsCost: 50,
          stock: 100,
          active: true,
          category: 'BEBIDA',
        },
      }),
      prisma.benefit.create({
        data: {
          merchantId: merchant.id,
          title: 'Combo 2x1 en Sándwich',
          description: 'Lleva 2 sándwiches mechada por el precio de 1',
          pointsCost: 150,
          stock: 30,
          active: true,
          category: 'COMIDA',
        },
      }),
      prisma.benefit.create({
        data: {
          merchantId: merchant.id,
          title: 'Postre del Día Gratis',
          description: 'Disfruta del postre del día sin costo adicional',
          pointsCost: 75,
          stock: 40,
          active: true,
          category: 'POSTRE',
        },
      }),
      prisma.benefit.create({
        data: {
          merchantId: merchant.id,
          title: 'Envío Gratis',
          description: 'Envío gratuito en pedidos a domicilio',
          pointsCost: 200,
          stock: 20,
          active: true,
          category: 'SERVICIO',
        },
      }),
    ]);

    console.log('Beneficios creados:', benefits.length);

    // ============================================
    // CREAR MISIONES
    // ============================================

    const missions = await Promise.all([
      prisma.mission.create({
        data: {
          name: 'Votar en Elecciones',
          description: 'Participa activamente en el proceso electoral votando en las próximas elecciones presidenciales',
          points: 100,
          frequency: 'ELECTION_PERIOD',
          cooldownDays: 1460,
          evidenceType: 'DOCUMENT',
          category: 'VOTING',
          active: true,
        },
      }),
      prisma.mission.create({
        data: {
          name: 'Recoger Basura',
          description: 'Recoge y dispone correctamente al menos 5kg de basura de espacios públicos',
          points: 50,
          frequency: 'WEEKLY',
          cooldownDays: 7,
          evidenceType: 'PHOTO',
          category: 'ENVIRONMENT',
          active: true,
        },
      }),
      prisma.mission.create({
        data: {
          name: 'Reportar Problema Público',
          description: 'Reporta un problema de infraestructura o servicio público y da seguimiento',
          points: 30,
          frequency: 'DAILY',
          cooldownDays: 1,
          evidenceType: 'PHOTO',
          category: 'REPORTING',
          active: true,
        },
      }),
      prisma.mission.create({
        data: {
          name: 'Participar en Junta Vecinal',
          description: 'Asiste y participa activamente en una sesión de la junta vecinal de tu comunidad',
          points: 75,
          frequency: 'MONTHLY',
          cooldownDays: 30,
          evidenceType: 'CERTIFICATE',
          category: 'COMMUNITY',
          active: true,
        },
      }),
    ]);

    console.log('Misiones creadas:', missions.length);

    // ============================================
    // CREAR TRANSACCIONES DE EJEMPLO (PARA UserHomeScreen)
    // ============================================

    // ===== TRANSACCIONES DE DICIEMBRE 2025 (MES PASADO) =====
    
    // Transacciones de diciembre para user1 (María)
    await prisma.pointTransaction.create({
      data: {
        walletId: user1.wallet.id,
        type: 'EARNED',
        amount: 100,
        description: 'Misión aprobada: Votar en Elecciones',
        createdAt: new Date('2025-12-05T10:30:00Z'),
      },
    });

    await prisma.pointTransaction.create({
      data: {
        walletId: user1.wallet.id,
        type: 'EARNED',
        amount: 50,
        description: 'Misión aprobada: Recoger Basura',
        createdAt: new Date('2025-12-10T14:20:00Z'),
      },
    });

    await prisma.pointTransaction.create({
      data: {
        walletId: user1.wallet.id,
        type: 'EARNED',
        amount: 75,
        description: 'Misión aprobada: Participar en Junta Vecinal',
        createdAt: new Date('2025-12-15T16:45:00Z'),
      },
    });

    await prisma.pointTransaction.create({
      data: {
        walletId: user1.wallet.id,
        type: 'SPENT',
        amount: 50,
        description: 'Canjeado: Café Gratis',
        createdAt: new Date('2025-12-18T09:15:00Z'),
      },
    });

    await prisma.pointTransaction.create({
      data: {
        walletId: user1.wallet.id,
        type: 'EARNED',
        amount: 30,
        description: 'Misión aprobada: Reportar Problema Público',
        createdAt: new Date('2025-12-22T11:30:00Z'),
      },
    });

    // Transacciones de diciembre para user2 (Juan)
    await prisma.pointTransaction.create({
      data: {
        walletId: user2.wallet.id,
        type: 'EARNED',
        amount: 75,
        description: 'Misión aprobada: Participar en Junta Vecinal',
        createdAt: new Date('2025-12-08T15:00:00Z'),
      },
    });

    await prisma.pointTransaction.create({
      data: {
        walletId: user2.wallet.id,
        type: 'EARNED',
        amount: 50,
        description: 'Misión aprobada: Recoger Basura',
        createdAt: new Date('2025-12-12T10:30:00Z'),
      },
    });

    await prisma.pointTransaction.create({
      data: {
        walletId: user2.wallet.id,
        type: 'EARNED',
        amount: 30,
        description: 'Misión aprobada: Reportar Problema Público',
        createdAt: new Date('2025-12-20T13:45:00Z'),
      },
    });

    // ===== TRANSACCIONES DE ENERO 2026 (MES ACTUAL) =====

    // Transacciones para user1 (María)
    await prisma.pointTransaction.create({
      data: {
        walletId: user1.wallet.id,
        type: 'EARNED',
        amount: 150,
        description: 'Bono de registro en plataforma',
      },
    });

    await prisma.pointTransaction.create({
      data: {
        walletId: user1.wallet.id,
        type: 'EARNED',
        amount: 100,
        description: 'Transporte ecológico - 5 viajes en bicicleta',
      },
    });

    await prisma.pointTransaction.create({
      data: {
        walletId: user1.wallet.id,
        type: 'SPENT',
        amount: 50,
        description: 'Canjeado por descuento café',
      },
    });

    await prisma.pointTransaction.create({
      data: {
        walletId: user1.wallet.id,
        type: 'EARNED',
        amount: 200,
        description: 'Reducción de plástico - 2kg reciclados',
      },
    });

    await prisma.pointTransaction.create({
      data: {
        walletId: user1.wallet.id,
        type: 'EARNED',
        amount: 50,
        description: 'Energía renovable - Uso paneles solares',
      },
    });

    // Transacciones para user2 (Juan)
    await prisma.pointTransaction.create({
      data: {
        walletId: user2.wallet.id,
        type: 'EARNED',
        amount: 150,
        description: 'Bono de registro en plataforma',
      },
    });

    await prisma.pointTransaction.create({
      data: {
        walletId: user2.wallet.id,
        type: 'EARNED',
        amount: 75,
        description: 'Ahorro de agua - Ducha corta',
      },
    });

    await prisma.pointTransaction.create({
      data: {
        walletId: user2.wallet.id,
        type: 'EARNED',
        amount: 80,
        description: 'Voluntariado en limpieza de parque',
      },
    });

    console.log('Transacciones de ejemplo creadas');

    console.log('\nSeed completado exitosamente');
    console.log('Datos de prueba creados:');
    console.log('   Admin Master: master@puntos-ciudadanos.com / Master@2025');
    console.log('   Usuario 1: maria@example.com / user123 (Balance: 450)');
    console.log('     - Diciembre 2025: +255 puntos ganados');
    console.log('     - Enero 2026: +500 puntos ganados');
    console.log('   Usuario 2: juan@example.com / user123 (Balance: 300)');
    console.log('     - Diciembre 2025: +155 puntos ganados');
    console.log('     - Enero 2026: +305 puntos ganados');
    console.log('   Comercio: mati@mechada.com / merchant123');
    console.log('   Misiones: 4 creadas');
    console.log('   Beneficios: 5 creados');
    console.log('   Transacciones: 16 creadas (8 en diciembre + 8 en enero)\n');
    
  } catch (error) {
    console.error('Error durante el seed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
