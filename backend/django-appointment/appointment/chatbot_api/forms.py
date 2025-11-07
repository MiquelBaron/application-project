from django import forms
from django.core.exceptions import ValidationError
from ..models import WorkingHours, DAYS_OF_WEEK

class WorkingHoursForm(forms.ModelForm):
    # Reemplazamos el field por uno que permita múltiples elecciones
    days_of_week = forms.MultipleChoiceField(
        choices=DAYS_OF_WEEK,
        widget=forms.CheckboxSelectMultiple,
        label="Days of the Week"
    )

    class Meta:
        model = WorkingHours
        fields = ['staff_member', 'start_time', 'end_time']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Si estamos editando un objeto existente, pre-seleccionamos el día
        if self.instance.pk:
            self.fields['days_of_week'].initial = [str(self.instance.day_of_week)]

    def clean(self):
        cleaned_data = super().clean()
        start_time = cleaned_data.get("start_time")
        end_time = cleaned_data.get("end_time")
        if start_time and end_time and start_time >= end_time:
            raise ValidationError("Start time must be before end time")
        return cleaned_data

    def save(self, commit=True):
        """
        En lugar de guardar una sola instancia, creamos varias según los días seleccionados
        """
        days = self.cleaned_data.get("days_of_week")
        staff_member = self.cleaned_data.get("staff_member")
        start_time = self.cleaned_data.get("start_time")
        end_time = self.cleaned_data.get("end_time")
        last_obj = None
        # Borrar la instancia si es edición de un solo día
        if self.instance.pk:
            self.instance.delete()

        # Crear una instancia por cada día seleccionado
        for day in days:
            last_obj = WorkingHours.objects.create(
                staff_member=staff_member,
                day_of_week=int(day),
                start_time=start_time,
                end_time=end_time
            )
        return last_obj

    def save_m2m(self):
        # Esto evita el error en el admin
        pass