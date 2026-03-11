from fastapi import FastAPI

app = FastAPI()

@app.get('/')
def base():
    return {
        'Василевская Алина': {'src': 'https://jhtcwaillrfwthaxukyy.supabase.co/storage/v1/object/public/miss_photos/aline.JPG'},
        'Коновалова Настя': {'src': 'https://jhtcwaillrfwthaxukyy.supabase.co/storage/v1/object/public/miss_photos/nasya.png'},
        'Антонова Ксюша': {'src': 'https://jhtcwaillrfwthaxukyy.supabase.co/storage/v1/object/public/miss_photos/ksusha.jpg'},
        'Сидоренко Эмилия': {'src': 'https://jhtcwaillrfwthaxukyy.supabase.co/storage/v1/object/public/miss_photos/emily.png'},
        'Самокиш Ангелина': {'src': 'https://jhtcwaillrfwthaxukyy.supabase.co/storage/v1/object/public/miss_photos/angie.png'},
        'Шаповалова Адель': {'src': 'https://jhtcwaillrfwthaxukyy.supabase.co/storage/v1/object/public/miss_photos/adely.png'},
        'Искорцева Полина': {'src': 'https://jhtcwaillrfwthaxukyy.supabase.co/storage/v1/object/public/miss_photos/poline.jpg'},
        'Ляшевич Соня': {'src': 'https://jhtcwaillrfwthaxukyy.supabase.co/storage/v1/object/public/miss_photos/sonya.jpg'},
    }