import { Avatar as AvatarPrimitive } from '@base-ui/react/avatar'
import { forwardRef, type ComponentPropsWithRef } from 'react'
import { cn } from '@/lib/utils'

const Avatar = forwardRef<HTMLDivElement, ComponentPropsWithRef<typeof AvatarPrimitive.Root> & { size?: 'default' | 'sm' | 'lg' }>(
  ({ className, size = 'default', ...props }, ref) => (
    <AvatarPrimitive.Root
      ref={ref}
      className={cn(
        'relative flex shrink-0 overflow-hidden rounded-full',
        size === 'sm' && 'size-7',
        size === 'default' && 'size-9',
        size === 'lg' && 'size-11',
        className,
      )}
      {...props}
    />
  ),
)
Avatar.displayName = 'Avatar'

const AvatarImage = forwardRef<HTMLImageElement, ComponentPropsWithRef<typeof AvatarPrimitive.Image>>(
  ({ className, ...props }, ref) => (
    <AvatarPrimitive.Image
      ref={ref}
      className={cn('aspect-square h-full w-full object-cover', className)}
      {...props}
    />
  ),
)
AvatarImage.displayName = 'AvatarImage'

const AvatarFallback = forwardRef<HTMLSpanElement, ComponentPropsWithRef<typeof AvatarPrimitive.Fallback>>(
  ({ className, ...props }, ref) => (
    <AvatarPrimitive.Fallback
      ref={ref}
      className={cn(
        'flex h-full w-full items-center justify-center rounded-full bg-muted text-xs font-medium',
        className,
      )}
      {...props}
    />
  ),
)
AvatarFallback.displayName = 'AvatarFallback'

const AvatarBadge = forwardRef<HTMLSpanElement, ComponentPropsWithRef<'span'>>(
  ({ className, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        'absolute bottom-0 right-0 size-3 rounded-full border-2 border-background bg-background',
        className,
      )}
      {...props}
    />
  ),
)
AvatarBadge.displayName = 'AvatarBadge'

const AvatarGroup = forwardRef<HTMLDivElement, ComponentPropsWithRef<'div'>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex -space-x-2 rtl:space-x-reverse', className)}
      {...props}
    />
  ),
)
AvatarGroup.displayName = 'AvatarGroup'

const AvatarGroupCount = forwardRef<HTMLDivElement, ComponentPropsWithRef<'div'>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'relative flex size-9 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-medium text-muted-foreground',
        className,
      )}
      {...props}
    />
  ),
)
AvatarGroupCount.displayName = 'AvatarGroupCount'

export { Avatar, AvatarImage, AvatarFallback, AvatarBadge, AvatarGroup, AvatarGroupCount }
