import type { Component } from 'vue'

export type CategoryId = 'all' | 'coffee' | 'tea' | 'dessert' | 'cold'

export interface CategoryTab {
  id: CategoryId
  label: string
  icon: Component
  emptyState: string
}
