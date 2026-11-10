import { AppDataSource } from '../db'
import { UserService } from '../services/user.service'

try {
    await AppDataSource.initialize();
    const result = await UserService.purgeDeleted();
    console.log(`Users permanently purged: ${result.affected ?? 0}`);
} catch (error) {
    console.error(error);
    process.exitCode = 1;
} finally {
    if (AppDataSource.isInitialized) await AppDataSource.destroy();
}
