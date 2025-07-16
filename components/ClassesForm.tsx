import React from 'react';
import { z } from 'zod';
import { FormItem, FormLabel, FormControl, FormMessage } from './Form';
import { Input } from './Input';
import { Button } from './Button';
import { Checkbox } from './Checkbox';
import { Plus, Trash2 } from 'lucide-react';
import { setupFormSchema } from '../helpers/setupFormSchema';
import styles from './FormStyles.module.css';

type FormProps = {
  form: any; // UseFormReturn<z.infer<typeof setupFormSchema>>;
};

export const ClassesForm = ({ form }: FormProps) => {
  const { values, setValues, validateField } = form;

  const addClass = () => {
    setValues((prev: any) => ({
      ...prev,
      classes: [...prev.classes, { id: crypto.randomUUID(), name: '', subjects: [{ name: '', frequency: 1, requiresSpecificRoom: false }] }],
    }));
  };

  const removeClass = (index: number) => {
    setValues((prev: any) => ({
      ...prev,
      classes: prev.classes.filter((_: any, i: number) => i !== index),
    }));
    validateField('classes');
  };

  const updateClass = (index: number, field: string, value: any) => {
    setValues((prev: any) => {
      const newClasses = [...prev.classes];
      newClasses[index] = { ...newClasses[index], [field]: value };
      return { ...prev, classes: newClasses };
    });
  };

  const addSubject = (classIndex: number) => {
    setValues((prev: any) => {
      const newClasses = [...prev.classes];
      newClasses[classIndex].subjects.push({ name: '', frequency: 1, requiresSpecificRoom: false });
      return { ...prev, classes: newClasses };
    });
  };

  const removeSubject = (classIndex: number, subjectIndex: number) => {
    setValues((prev: any) => {
      const newClasses = [...prev.classes];
      newClasses[classIndex].subjects = newClasses[classIndex].subjects.filter((_: any, i: number) => i !== subjectIndex);
      return { ...prev, classes: newClasses };
    });
    validateField(`classes.${classIndex}.subjects`);
  };

  const updateSubject = (classIndex: number, subjectIndex: number, field: string, value: any) => {
    setValues((prev: any) => {
      const newClasses = [...prev.classes];
      newClasses[classIndex].subjects[subjectIndex] = { ...newClasses[classIndex].subjects[subjectIndex], [field]: value };
      return { ...prev, classes: newClasses };
    });
  };

  return (
    <div className={styles.formSection}>
      <h2 className={styles.sectionTitle}>Class Data</h2>
      <p className={styles.sectionDescription}>Define each class and the subjects they require per week.</p>
      
      <FormItem name="classes">
        {values.classes.map((classItem: any, index: number) => (
          <div key={classItem.id} className={styles.arrayItemCard}>
            <div className={styles.cardHeader}>
              <FormItem name={`classes.${index}.name`} className={styles.cardTitleFormItem}>
                <FormControl>
                  <Input
                    value={classItem.name}
                    onChange={(e) => updateClass(index, 'name', e.target.value)}
                    placeholder="e.g., Grade 7B"
                    className={styles.cardTitleInput}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
              <Button type="button" variant="ghost" size="icon-sm" onClick={() => removeClass(index)}>
                <Trash2 size={16} />
              </Button>
            </div>
            <div className={styles.cardContent}>
              <FormItem name={`classes.${index}.subjects`}>
                <FormLabel>Subjects for this Class</FormLabel>
                {classItem.subjects.map((subject: any, sIndex: number) => (
                  <div key={sIndex} className={styles.subjectRow}>
                    <FormItem name={`classes.${index}.subjects.${sIndex}.name`} className={styles.flexGrow}>
                      <FormControl>
                        <Input
                          value={subject.name}
                          onChange={(e) => updateSubject(index, sIndex, 'name', e.target.value)}
                          placeholder="Subject Name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                    <FormItem name={`classes.${index}.subjects.${sIndex}.frequency`}>
                      <FormControl>
                        <Input
                          type="number"
                          value={subject.frequency}
                          onChange={(e) => updateSubject(index, sIndex, 'frequency', parseInt(e.target.value, 10) || 0)}
                          placeholder="Weekly Freq."
                          className={styles.frequencyInput}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                    <FormItem name={`classes.${index}.subjects.${sIndex}.requiresSpecificRoom`} className={styles.checkboxFormItem}>
                      <div className={styles.checkboxItem}>
                        <FormControl>
                          <Checkbox
                            id={`spec-room-${index}-${sIndex}`}
                            checked={subject.requiresSpecificRoom}
                            onChange={(event: React.ChangeEvent<HTMLInputElement>) => updateSubject(index, sIndex, 'requiresSpecificRoom', event.target.checked)}
                          />
                        </FormControl>
                        <label htmlFor={`spec-room-${index}-${sIndex}`} className={styles.checkboxLabel}>Specific Room</label>
                      </div>
                      <FormMessage />
                    </FormItem>
                    <Button type="button" variant="ghost" size="icon-sm" onClick={() => removeSubject(index, sIndex)}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => addSubject(index)} className={styles.addButton}>
                  <Plus size={14} /> Add Subject
                </Button>
                <FormMessage />
              </FormItem>
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={addClass} className={styles.addArrayItemButton}>
          <Plus size={16} /> Add Class
        </Button>
        <FormMessage />
      </FormItem>
    </div>
  );
};