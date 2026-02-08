const { Subject } = require('./src/models');
const sequelize = require('./src/config/database');

async function updateSubjectCodes() {
    try {
        await sequelize.authenticate();
        console.log('✅ Database connected\n');

        // Subject code mapping
        const updates = [
            { name: 'Engineering Maths-II', newCode: '25MAT21' },
            { name: 'English Communication', newCode: '25ENG21' },
            { name: 'CAEG', newCode: '25AEG22' },
            { name: 'Python', newCode: '25CS23' }
        ];

        for (const update of updates) {
            const subject = await Subject.findOne({
                where: { name: update.name }
            });

            if (subject) {
                await subject.update({ code: update.newCode });
                console.log(`✅ ${update.name} → ${update.newCode}`);
            } else {
                console.log(`❌ Subject "${update.name}" not found`);
            }
        }

        console.log('\n✅ Subject codes updated successfully!');
        await sequelize.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

updateSubjectCodes();
