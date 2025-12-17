import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Pencil, Trash2, Check, X, Tags } from 'lucide-react';
import { Category } from '@/hooks/useCategories';
import { toast } from 'sonner';

interface CategoryManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  onAddCategory: (label: string) => { success: boolean; message: string };
  onRenameCategory: (oldValue: string, newLabel: string) => { success: boolean; message: string };
  onDeleteCategory: (value: string) => { success: boolean; message: string };
}

export const CategoryManagementDialog = ({
  open,
  onOpenChange,
  categories,
  onAddCategory,
  onRenameCategory,
  onDeleteCategory,
}: CategoryManagementDialogProps) => {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState('');

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) {
      toast.error('Unesite naziv kategorije.');
      return;
    }
    const result = onAddCategory(newCategoryName.trim());
    if (result.success) {
      toast.success(result.message);
      setNewCategoryName('');
    } else {
      toast.error(result.message);
    }
  };

  const handleStartEdit = (category: Category) => {
    setEditingCategory(category.value);
    setEditingLabel(category.label);
  };

  const handleSaveEdit = () => {
    if (!editingCategory || !editingLabel.trim()) return;
    
    const result = onRenameCategory(editingCategory, editingLabel.trim());
    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
    setEditingCategory(null);
    setEditingLabel('');
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
    setEditingLabel('');
  };

  const handleDelete = (value: string) => {
    const result = onDeleteCategory(value);
    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tags className="h-5 w-5" />
            Upravljanje kategorijama
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Add new category */}
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="new-category" className="sr-only">Nova kategorija</Label>
              <Input
                id="new-category"
                placeholder="Nova kategorija..."
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
              />
            </div>
            <Button onClick={handleAddCategory} size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Category list */}
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {categories.map((category) => (
              <div
                key={category.value}
                className="flex items-center gap-2 p-2 rounded-md border bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                {editingCategory === category.value ? (
                  <>
                    <Input
                      value={editingLabel}
                      onChange={(e) => setEditingLabel(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit();
                        if (e.key === 'Escape') handleCancelEdit();
                      }}
                      className="flex-1 h-8"
                      autoFocus
                    />
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleSaveEdit}>
                      <Check className="h-4 w-4 text-success" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCancelEdit}>
                      <X className="h-4 w-4 text-destructive" />
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 font-medium">{category.label}</span>
                    <span className="text-xs text-muted-foreground">{category.value}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleStartEdit(category)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(category.value)}
                      disabled={category.value === 'ostalo'}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
