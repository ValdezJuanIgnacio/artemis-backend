// ==========================================
// SCRIPT DE DIAGNÓSTICO - LOGIN ADMIN
// diagnose_login.js
// ==========================================

const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function diagnoseLogin() {
    let connection;
    
    try {
        console.log('🔍 DIAGNÓSTICO DE LOGIN ADMIN');
        console.log('==========================================\n');
        
        // 1. Conectar a la base de datos
        console.log('📡 Paso 1: Conectando a la base de datos...');
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'artemis'
        });
        console.log('✅ Conexión exitosa\n');
        
        // 2. Buscar el usuario admin
        console.log('📡 Paso 2: Buscando usuario admin...');
        const [users] = await connection.query(
            'SELECT * FROM users WHERE email = ?',
            ['nono@gmail.com']
        );
        
        if (users.length === 0) {
            console.log('❌ ERROR: No se encontró ningún usuario con email "admin@artemis.com"');
            console.log('\n💡 Solución: Ejecuta el script test_admin_password.js primero\n');
            return;
        }
        
        const user = users[0];
        console.log('✅ Usuario encontrado:');
        console.log('   ID:', user.id);
        console.log('   Username:', user.username);
        console.log('   Email:', user.email);
        console.log('   Role:', user.role);
        console.log('   Password Hash:', user.password_hash);
        console.log('');
        
        // 3. Verificar que el rol sea admin
        console.log('📡 Paso 3: Verificando rol...');
        if (user.role !== 'admin') {
            console.log('❌ ERROR: El rol del usuario es "' + user.role + '" pero debería ser "admin"');
            console.log('\n💡 Ejecuta este SQL en phpMyAdmin:');
            console.log(`UPDATE users SET role = 'admin' WHERE email = 'admin@artemis.com';`);
            console.log('');
        } else {
            console.log('✅ Rol correcto: admin\n');
        }
        
        // 4. Probar diferentes contraseñas
        console.log('📡 Paso 4: Probando contraseñas...\n');
        
        const passwordsToTest = [
            'admin123',
            'Admin123',
            'ADMIN123',
            'admin',
            '123456'
        ];
        
        let passwordFound = false;
        
        for (const pwd of passwordsToTest) {
            const isMatch = await bcrypt.compare(pwd, user.password_hash);
            if (isMatch) {
                console.log('✅ ¡CONTRASEÑA ENCONTRADA!');
                console.log('==========================================');
                console.log('Email:', user.email);
                console.log('Contraseña:', pwd);
                console.log('==========================================\n');
                passwordFound = true;
                break;
            } else {
                console.log(`❌ "${pwd}" - No coincide`);
            }
        }
        
        if (!passwordFound) {
            console.log('\n❌ Ninguna contraseña común funcionó\n');
            console.log('🔧 SOLUCIÓN: Genera un nuevo hash con el script');
            console.log('   Ejecuta: node generate_hash.js\n');
        }
        
        // 5. Verificar el hash actual
        console.log('📡 Paso 5: Verificando formato del hash...');
        if (user.password_hash.startsWith('$2a$10$') || user.password_hash.startsWith('$2b$10$')) {
            console.log('✅ El formato del hash es correcto (bcrypt)\n');
        } else {
            console.log('❌ El formato del hash parece incorrecto');
            console.log('   Hash actual:', user.password_hash);
            console.log('   Debería empezar con: $2a$10$ o $2b$10$\n');
        }
        
        // 6. Probar generación de nuevo hash
        console.log('📡 Paso 6: Generando hash de prueba para "admin123"...');
        const testHash = await bcrypt.hash('admin123', 10);
        const testMatch = await bcrypt.compare('admin123', testHash);
        console.log('   Nuevo hash generado:', testHash);
        console.log('   Verificación:', testMatch ? '✅ Funciona' : '❌ No funciona');
        console.log('');
        
        // 7. Resumen final
        console.log('==========================================');
        console.log('📊 RESUMEN DEL DIAGNÓSTICO');
        console.log('==========================================');
        console.log('Usuario encontrado:', users.length > 0 ? '✅ Sí' : '❌ No');
        console.log('Rol es admin:', user.role === 'admin' ? '✅ Sí' : '❌ No');
        console.log('Hash válido:', user.password_hash.startsWith('$2a$10$') ? '✅ Sí' : '❌ No');
        console.log('Contraseña funciona:', passwordFound ? '✅ Sí' : '❌ No');
        console.log('==========================================\n');
        
        if (passwordFound) {
            console.log('🎉 ¡Todo está correcto! Deberías poder hacer login.');
            console.log('   Si aún tienes problemas, verifica:');
            console.log('   1. Que el backend esté corriendo');
            console.log('   2. Que la URL del API sea correcta');
            console.log('   3. Que no haya espacios en el email o contraseña\n');
        } else {
            console.log('⚠️  Acción requerida:');
            console.log('   1. Ejecuta: node generate_hash.js');
            console.log('   2. Copia el SQL que genera');
            console.log('   3. Ejecuta ese SQL en phpMyAdmin');
            console.log('   4. Intenta hacer login de nuevo\n');
        }
        
    } catch (error) {
        console.error('❌ Error durante el diagnóstico:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Ejecutar diagnóstico
diagnoseLogin();
