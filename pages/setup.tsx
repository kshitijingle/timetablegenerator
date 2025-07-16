import React, { useEffect } from 'react';
import { z } from 'zod';
import { useForm, Form } from '../components/Form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/Tabs';
import { Button } from '../components/Button';
import { Spinner } from '../components/Spinner';
import { SchoolParametersForm } from '../components/SchoolParametersForm';
import { TeachersForm } from '../components/TeachersForm';
import { ClassesForm } from '../components/ClassesForm';
import { ConstraintsForm } from '../components/ConstraintsForm';
import { setupFormSchema, defaultSetupValues } from '../helpers/setupFormSchema';
import { useSchoolConfig } from '../helpers/useSchoolConfig';
import { useSaveSchoolConfig } from '../helpers/useSaveSchoolConfig';
import { useGenerateTimetable } from '../helpers/useGenerateTimetable';
import styles from './setup.module.css';
import { Helmet } from 'react-helmet';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const SetupPage = () => {
  const navigate = useNavigate();
  const { data: existingConfig, isFetching: isLoadingConfig } = useSchoolConfig();
  const saveConfigMutation = useSaveSchoolConfig();
  const generateTimetableMutation = useGenerateTimetable();

  const form = useForm({
    schema: setupFormSchema,
    defaultValues: defaultSetupValues,
  });

  // Load existing configuration when available
  useEffect(() => {
    if (existingConfig?.schoolConfig) {
      form.setValues(existingConfig.schoolConfig);
    }
  }, [existingConfig, form.setValues]);

  const onSubmit = async (values: z.infer<typeof setupFormSchema>) => {
    try {
      const result = await saveConfigMutation.mutateAsync(values);
      toast.success("Configuration Saved!", {
        description: "Your school configuration has been saved successfully.",
      });
    } catch (error) {
      toast.error("Save Failed", {
        description: error instanceof Error ? error.message : "Failed to save configuration.",
      });
    }
  };

  const handleGenerateTimetable = async () => {
    if (!existingConfig?.schoolConfigId) {
      toast.error("No Configuration", {
        description: "Please save your configuration first before generating a timetable.",
      });
      return;
    }

    try {
      const result = await generateTimetableMutation.mutateAsync({
        schoolConfigId: existingConfig.schoolConfigId,
      });
      toast.success("Timetable Generation Started!", {
        description: "Your timetable is being generated. Redirecting to view...",
      });
      // Navigate to timetable page
      navigate('/timetable');
    } catch (error) {
      toast.error("Generation Failed", {
        description: error instanceof Error ? error.message : "Failed to generate timetable.",
      });
    }
  };

  return (
    <>
      <Helmet>
        <title>Setup - Smart Timetable Generator</title>
        <meta name="description" content="Configure all school parameters, teacher profiles, class data, and constraints for timetable generation." />
      </Helmet>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>Timetable Setup</h1>
          <p className={styles.subtitle}>
            Provide the necessary information in each tab to generate an optimized timetable.
          </p>
        </header>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className={styles.form}>
            <Tabs defaultValue="school" className={styles.tabs}>
              <TabsList>
                <TabsTrigger value="school">School Parameters</TabsTrigger>
                <TabsTrigger value="teachers">Teachers</TabsTrigger>
                <TabsTrigger value="classes">Classes</TabsTrigger>
                <TabsTrigger value="constraints">Constraints</TabsTrigger>
              </TabsList>
              <div className={styles.tabContentWrapper}>
                <TabsContent value="school">
                  <SchoolParametersForm form={form} />
                </TabsContent>
                <TabsContent value="teachers">
                  <TeachersForm form={form} />
                </TabsContent>
                <TabsContent value="classes">
                  <ClassesForm form={form} />
                </TabsContent>
                <TabsContent value="constraints">
                  <ConstraintsForm form={form} />
                </TabsContent>
              </div>
            </Tabs>
            <div className={styles.footer}>
              <Button 
                type="submit" 
                size="lg"
                disabled={saveConfigMutation.isPending || isLoadingConfig}
              >
                {saveConfigMutation.isPending ? (
                  <>
                    <Spinner size="sm" />
                    Saving...
                  </>
                ) : (
                  'Save Configuration'
                )}
              </Button>
              <Button 
                type="button"
                variant="secondary"
                size="lg"
                onClick={handleGenerateTimetable}
                disabled={generateTimetableMutation.isPending || !existingConfig?.schoolConfigId}
              >
                {generateTimetableMutation.isPending ? (
                  <>
                    <Spinner size="sm" />
                    Generating...
                  </>
                ) : (
                  'Generate Timetable'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </>
  );
};

export default SetupPage;