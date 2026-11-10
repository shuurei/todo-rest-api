import { Cron } from 'croner'
import { UserService } from '../services/user.service'

export function startUserPurgeJob() {
    const job = new Cron('*/15 * * * *', {
        timezone: 'UTC',
        protect: true,
        unref: true,
        catch: error => console.error('User purge failed:', error),
    }, async () => {
        const result = await UserService.purgeDeleted();
        if (result.affected) console.log(`Users permanently purged: ${result.affected}`);
    });

    void job.trigger();
    return () => job.stop();
}