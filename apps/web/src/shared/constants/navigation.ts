import { CartIcon, CatalogIcon, FavoritesIcon } from '@/shared/icons'
import type { NavigationItem } from '@/shared/types'

export const NAVIGATION_ITEMS: readonly NavigationItem[] = [
  { label: 'Главная', to: '/', icon: CatalogIcon },
  { label: 'Избранное', to: '/favorites', icon: FavoritesIcon },
  { label: 'Мой заказ', to: '/cart', icon: CartIcon },
]
