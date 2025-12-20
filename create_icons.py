from PIL import Image, ImageDraw, ImageFont

# Créer l'icône 512x512
img = Image.new('RGB', (512, 512), color='#4CAF50')
draw = ImageDraw.Draw(img)

# Fond blanc arrondi
draw.rounded_rectangle([50, 50, 462, 462], radius=60, fill='white')

# Dessiner un symbole de document/note
# Rectangle pour le document
draw.rounded_rectangle([150, 120, 362, 400], radius=10, fill='#4CAF50')

# Lignes d'écriture
for i in range(4):
    y = 180 + i * 50
    draw.rectangle([180, y, 332, y + 20], fill='white')

# Sauvegarder 512x512
img.save('icon-512.png')
print('✓ icon-512.png créée')

# Créer 192x192
img_192 = img.resize((192, 192), Image.LANCZOS)
img_192.save('icon-192.png')
print('✓ icon-192.png créée')

print('\n✅ Icônes créées avec succès!')
