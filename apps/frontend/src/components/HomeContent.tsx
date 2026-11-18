import type { ComponentProps } from 'react';
import type { UserPreferences } from '@nodus/shared';
import HomeApps from '@/components/HomeApps';
import HomeWidgets from '@/components/HomeWidgets';
import { cn } from '@/utils/cn';

type Props = Omit<ComponentProps<typeof HomeApps>, 'hasWallpaper' | 'alignment'> & {
    settings: UserPreferences;
};

const alignments = ['left', 'center', 'right'] as const;
const columns = ['lg:col-start-1', 'lg:col-start-2', 'lg:col-start-3'];
const alignmentClasses = ['items-center lg:items-start', 'items-center', 'items-center lg:items-end'];

export default function HomeContent({ settings, ...appsProps }: Props) {
    const widgets = [
        ...(settings.homeShowClock ? [{ id: 'clock' as const, ...settings.homeClockLayout }] : []),
        ...(settings.homeShowWeather && settings.homeWeatherLocation
            ? [{ id: 'weather' as const, ...settings.homeWeatherLayout }] : [])
    ];

    function widgetBand() {
        const regions = alignments.map((alignment, index) => ({
            index,
            items: widgets.filter((widget) => widget.position === `top-${alignment}`)
        })).filter((region) => region.items.length);
        if (!regions.length) return null;

        return <div className='grid w-full grid-cols-1 items-start gap-6 lg:grid-cols-3'>
            {regions.map(({ index, items }) => <div
                key={index}
                className={cn('flex min-w-0 flex-col gap-6', columns[index], alignmentClasses[index])}
            >
                {items.map((item) => <HomeWidgets
                    key={item.id}
                    widget={item.id}
                    size={item.size}
                    weatherLocation={settings.homeWeatherLocation}
                    hasWallpaper={!!settings.homeWallpaper}
                />)}
            </div>)}
        </div>;
    }

    return <div className='relative z-10 flex w-full flex-col items-start gap-6'>
        {widgetBand()}
        <div className='w-full'>
            <HomeApps {...appsProps} hasWallpaper={!!settings.homeWallpaper} alignment={settings.homeAppsAlignment} />
        </div>
    </div>;
}
