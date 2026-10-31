import { CartIcon, CatalogIcon, CheckoutIcon, FavoritesIcon } from '@/shared/icons'
import type { NavigationItem } from '@/shared/types'

export const NAVIGATION_ITEMS: readonly NavigationItem[] = [
  { label: 'Главная', to: '/', icon: CatalogIcon },
  { label: 'Избранное', to: '/favorites', icon: FavoritesIcon },
  { label: 'Корзина', to: '/cart', icon: CartIcon },
  { label: 'Оформление', to: '/checkout', icon: CheckoutIcon },
]
