import React from 'react';
import { z } from 'zod';
import { FormItem, FormLabel, FormControl, FormMessage } from './Form';
import { Input } from './Input';
import { Button } from './Button';
import { Plus, Trash2 } from 'lucide-react';
import { setupFormSchema } from '../helpers/setupFormSchema';
import styles from './FormStyles.module.css';

type FormProps = {
  form: any; // UseFormReturn<z.infer<typeof setupFormSchema>>;
};

export const TeachersForm = ({ form }: FormProps) => {
  const { values, setValues, validateField } = form;

  const addTeacher = () => {
    setValues((prev: any) => ({
      ...prev,
      teachers: [...prev.teachers, { id: crypto.randomUUID(), name: '', subjects: [''], maxHoursPerDay: 6, availability: [] }],
    }));
  };

  const removeTeacher = (index: number) => {
    setValues((prev: any) => ({
      ...prev,
      teachers: prev.teachers.filter((_: any, i: number) => i !== index),
    }));
    validateField('teachers');
  };

  const updateTeacher = (index: number, field: string, value: any) => {
    setValues((prev: any) => {
      const newTeachers = [...prev.teachers];
      newTeachers[index] = { ...newTeachers[index], [field]: value };
      return { ...prev, teachers: newTeachers };
    });
  };

  const addSubject = (teacherIndex: number) => {
    setValues((prev: any) => {
      const newTeachers = [...prev.teachers];
      newTeachers[teacherIndex].subjects.push('');
      return { ...prev, teachers: newTeachers };
    });
  };

  const removeSubject = (teacherIndex: number, subjectIndex: number) => {
    setValues((prev: any) => {
      const newTeachers = [...prev.teachers];
      newTeachers[teacherIndex].subjects = newTeachers[teacherIndex].subjects.filter((_: any, i: number) => i !== subjectIndex);
      return { ...prev, teachers: newTeachers };
    });
    validateField(`teachers.${teacherIndex}.subjects`);
  };

  const updateSubject = (teacherIndex: number, subjectIndex: number, value: string) => {
    setValues((prev: any) => {
      const newTeachers = [...prev.teachers];
      newTeachers[teacherIndex].subjects[subjectIndex] = value;
      return { ...prev, teachers: newTeachers };
    });
  };

  return (
    <div className={styles.formSection}>
      <h2 className={styles.sectionTitle}>Teacher Profiles</h2>
      <p className={styles.sectionDescription}>Add and manage teacher information, including their subjects and availability.</p>
      
      <FormItem name="teachers">
        {values.teachers.map((teacher: any, index: number) => (
          <div key={teacher.id} className={styles.arrayItemCard}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Teacher {index + 1}</h3>
              <Button type="button" variant="ghost" size="icon-sm" onClick={() => removeTeacher(index)}>
                <Trash2 size={16} />
              </Button>
            </div>
            <div className={styles.cardContent}>
              <div className={styles.grid}>
                <FormItem name={`teachers.${index}.name`}>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      value={teacher.name}
                      onChange={(e) => updateTeacher(index, 'name', e.target.value)}
                      placeholder="e.g., John Doe"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
                <FormItem name={`teachers.${index}.maxHoursPerDay`}>
                  <FormLabel>Max Hours/Day</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      value={teacher.maxHoursPerDay}
                      onChange={(e) => updateTeacher(index, 'maxHoursPerDay', parseInt(e.target.value, 10) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </div>
              <FormItem name={`teachers.${index}.subjects`}>
                <FormLabel>Subjects</FormLabel>
                {teacher.subjects.map((subject: string, sIndex: number) => (
                  <FormItem key={sIndex} name={`teachers.${index}.subjects.${sIndex}`}>
                    <div className={styles.arrayInputRow}>
                      <FormControl>
                        <Input
                          value={subject}
                          onChange={(e) => updateSubject(index, sIndex, e.target.value)}
                          placeholder="e.g., Mathematics"
                        />
                      </FormControl>
                      <Button type="button" variant="ghost" size="icon-sm" onClick={() => removeSubject(index, sIndex)}>
                        <Trash2 size={14} />
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => addSubject(index)} className={styles.addButton}>
                  <Plus size={14} /> Add Subject
                </Button>
                <FormMessage />
              </FormItem>
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={addTeacher} className={styles.addArrayItemButton}>
          <Plus size={16} /> Add Teacher
        </Button>
        <FormMessage />
      </FormItem>
    </div>
  );
};