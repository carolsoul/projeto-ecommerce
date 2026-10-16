"""
Gera a planilha de catálogo da The Bush para importação em /admin/products/upload.

Regras que a planilha respeita (de src/schemas/productSchema.ts):
  sku          obrigatório, vira o id do documento (minúsculo, espaço -> '-')
  name         obrigatório
  imageUrl     obrigatório e precisa ser URL válida -> DEIXADO EM BRANCO de propósito
  description  obrigatório
  features     obrigatório, separado por '|'
  price        número > 0
  mrp          opcional, mas se existir tem que ser >= price
  rating       número de 0 a 5
  reviewCount  inteiro >= 0
  category     opcional no schema, mas em branco o Papa manda `null` e o
               `z.coerce.string()` grava o TEXTO "null" — então sempre preenchida
  stock        inteiro >= 0, opcional

price/mrp/stock/reviewCount são INTEIROS de propósito: o Excel em pt-BR exporta
CSV com vírgula decimal, e `z.number()` recusa "1890,00". Sem casa decimal não
há separador para dar errado.
"""

from openpyxl import Workbook
from openpyxl.styles import Alignment, Font, PatternFill
from openpyxl.utils import get_column_letter

COLUMNS = [
    "sku", "name", "imageUrl", "description", "features",
    "price", "mrp", "rating", "reviewCount", "category", "stock",
]

# Cloudinary da The Bush.
#
# `f_auto,q_auto` deixa o Cloudinary escolher formato e compressão por navegador:
# o PNG que subir é entregue como WebP/AVIF sem você converter nada.
#
# O public_id é o nome do arquivo SEM extensão, e a URL também vai sem — com
# `f_auto` a extensão só atrapalharia, porque ela forçaria um formato fixo.
#
# Isto assume upload na RAIZ da Media Library. Dentro de uma pasta, o public_id
# viraria `pasta/sku` e todas as 72 URLs quebrariam.
CLOUDINARY_BASE = "https://res.cloudinary.com/mfy6wood/image/upload/f_auto,q_auto"


def image_url(sku: str) -> str:
    return f"{CLOUDINARY_BASE}/{sku}"

# (sku, name, description, features, price, mrp, rating, reviewCount, category, stock)
P = [
    # ---------------------------------------------------------------- moveis
    ("mob-banco-taboa", "Banco Taboa Trançado",
     "Banco baixo com assento trançado à mão em taboa colhida de forma manejada no Vale do Ribeira.",
     "Taboa trançada manualmente|Estrutura em eucalipto certificado|Assento 110 x 38 cm|Acabamento em óleo vegetal",
     1890, 2290, 4.8, 37, "moveis", 8),
    ("mob-poltrona-sabia", "Poltrona Sabiá",
     "Poltrona de braços baixos em louro-freijó com encosto em palha natural, inspirada no móvel modernista brasileiro.",
     "Louro-freijó de manejo certificado|Encosto em palha de tala|Almofada em linho lavado|Montagem por encaixe sem cola",
     4690, 5490, 4.9, 24, "moveis", 5),
    ("mob-mesa-centro-cumaru", "Mesa de Centro Cumaru",
     "Tampo maciço de cumaru sobre base tripé, com veio aparente e nenhuma emenda visível.",
     "Cumaru maciço|Base tripé em aço com pintura fosca|90 cm de diâmetro|Pés com ponteira de feltro",
     2740, None, 4.7, 19, "moveis", 6),
    ("mob-aparador-demolicao", "Aparador Madeira de Demolição",
     "Aparador de duas portas em peroba rosa reaproveitada de construções antigas — cada peça tem marca própria.",
     "Peroba rosa de demolição|Duas portas com dobradiça de latão|160 x 45 x 80 cm|Peça única, variação de tom esperada",
     5980, 6900, 5.0, 11, "moveis", 2),
    ("mob-cadeira-tucum", "Cadeira Tucum",
     "Cadeira de jantar com assento em couro vegetal de tucum curtido com tanino de acácia.",
     "Couro vegetal de tucum|Curtimento vegetal sem cromo|Estrutura em tauari|Empilhável até quatro unidades",
     1340, 1590, 4.6, 52, "moveis", 24),
    ("mob-estante-modular", "Estante Modular Peroba",
     "Sistema de prateleiras que cresce com a casa: três módulos que encaixam na vertical ou na horizontal.",
     "Peroba rosa reaproveitada|Módulos intercambiáveis|Fixação na parede inclusa|180 x 32 x 200 cm",
     7490, 8900, 4.8, 9, "moveis", 3),

    # ------------------------------------------------------------------ cama
    ("cam-lencol-linho", "Jogo de Lençol Linho Lavado",
     "Quatro peças em linho europeu pré-lavado, que amacia a cada lavagem em vez de desfiar.",
     "100% linho pré-lavado|Elástico em todo o contorno|Queen 158 x 198 cm|Tingimento sem metais pesados",
     1290, 1590, 4.9, 143, "cama", 30),
    ("cam-colcha-tear", "Colcha Algodão Cru em Tear Manual",
     "Colcha tecida em tear de pedal por artesãs do Agreste, em algodão cru sem alvejante.",
     "Algodão cru sem alvejante|Tecida em tear manual de pedal|King 260 x 280 cm|Franja torcida à mão",
     1740, None, 4.8, 61, "cama", 12),
    ("cam-manta-la-serrana", "Manta Lã Serrana",
     "Manta de lã virgem de ovelhas criadas na serra catarinense, cardada e tecida na região.",
     "Lã virgem 100%|Cardada e tecida no Sul|130 x 180 cm|Orla costurada à mão",
     980, 1180, 4.7, 48, "cama", 18),
    ("cam-almofada-macrame", "Almofada Macramê Cru",
     "Capa de almofada em macramê de algodão cru, com nó trabalhado em toda a face frontal.",
     "Algodão cru em macramê|Zíper invisível na base|50 x 50 cm|Enchimento em fibra reciclada incluso",
     290, 350, 4.5, 87, "cama", 40),
    ("cam-travesseiro-pena", "Travesseiro Pena Reciclada",
     "Travesseiro de pluma recuperada de indústria alimentícia, higienizada e certificada.",
     "Pluma recuperada e higienizada|Capa em percal de algodão orgânico|50 x 70 cm|Suporte médio",
     420, None, 4.4, 94, "cama", 35),
    ("cam-cabeceira-buriti", "Cabeceira Palha de Buriti",
     "Cabeceira de parede com trama aberta em palha de buriti sobre moldura de tauari.",
     "Palha de buriti do Jalapão|Moldura em tauari|Queen 165 x 110 cm|Fixação oculta na parede",
     2480, 2980, 4.9, 16, "cama", 7),

    # ----------------------------------------------------------------- banho
    ("ban-toalha-waffle", "Toalha Waffle Algodão Orgânico",
     "Toalha de banho em trama waffle, que seca em metade do tempo de uma felpuda comum.",
     "Algodão orgânico certificado|Trama waffle de secagem rápida|90 x 150 cm|Sem amaciante no acabamento",
     320, 390, 4.8, 112, "banho", 50),
    ("ban-roupao-linho", "Roupão Linho Pré-Lavado",
     "Roupão leve de linho com cinto do mesmo tecido, pensado para o calor brasileiro.",
     "Linho pré-lavado|Dois bolsos embutidos|Tamanho único|Cinto removível",
     890, 1090, 4.6, 38, "banho", 22),
    ("ban-saboneteira-sabao", "Saboneteira Pedra Sabão",
     "Saboneteira esculpida em pedra sabão de Minas, com canaleta que escoa a água.",
     "Pedra sabão de Ouro Preto|Canaleta de escoamento|12 x 9 cm|Esculpida à mão",
     140, None, 4.7, 73, "banho", 60),
    ("ban-tapete-sisal", "Tapete de Banheiro Sisal",
     "Tapete de sisal natural que não retém umidade e dispensa secagem na máquina.",
     "Sisal natural da Bahia|Base antiderrapante de borracha|60 x 90 cm|Escovação seca",
     260, 320, 4.3, 56, "banho", 28),
    ("ban-escovas-bambu", "Kit Escovas de Bambu",
     "Trio de escovas de corpo em bambu moso com cerdas de fibra vegetal, substituíveis.",
     "Bambu moso sem verniz|Cerdas de fibra vegetal|Três peças: corpo, pés e unhas|Cabeça substituível",
     180, 220, 4.5, 41, "banho", 45),
    ("ban-cesto-tala", "Cesto de Roupa Palha de Tala",
     "Cesto alto com tampa, trançado em palha de tala por mestres artesãos do Marajó.",
     "Palha de tala trançada|Tampa com alça de couro vegetal|45 cm de diâmetro x 60 cm|Forro de algodão removível",
     640, 780, 4.9, 29, "banho", 14),

    # ------------------------------------------------------------------ mesa
    ("mes-americano-dourado", "Jogo Americano Capim Dourado",
     "Par de jogos americanos em capim dourado do Jalapão, trançado por comunidade certificada.",
     "Capim dourado do Jalapão|Par de duas unidades|38 cm de diâmetro|Comércio direto com a comunidade",
     390, 460, 5.0, 67, "mesa", 20),
    ("mes-travessa-cunha", "Travessa Cerâmica de Cunha",
     "Travessa oval queimada em forno a lenha no vale de Cunha, com esmalte de cinza.",
     "Cerâmica de alta temperatura|Esmalte de cinza vegetal|36 x 24 cm|Apta para forno e micro-ondas",
     340, None, 4.8, 44, "mesa", 25),
    ("mes-tacas-reciclado", "Conjunto Taças Vidro Reciclado",
     "Seis taças sopradas à boca em vidro 100% reciclado — bolhas finas são parte do processo.",
     "Vidro 100% reciclado|Sopro à boca, peça a peça|350 ml cada|Seis unidades",
     480, 580, 4.6, 83, "mesa", 16),
    ("mes-guardanapo-natural", "Guardanapo Tingimento Natural",
     "Quatro guardanapos de algodão tingidos com casca de cebola, urucum e índigo.",
     "Algodão orgânico|Tingimento com pigmento vegetal|45 x 45 cm|Quatro unidades em tons variados",
     290, 360, 4.7, 51, "mesa", 32),
    ("mes-bowl-tracunhaem", "Bowl Barro de Tracunhaém",
     "Bowl de barro torneado em Tracunhaém, selado com cera de carnaúba em vez de esmalte químico.",
     "Barro torneado à mão|Selagem em cera de carnaúba|22 cm de diâmetro|Lavar à mão",
     220, None, 4.5, 39, "mesa", 30),
    ("mes-descanso-cortica", "Descanso de Panela Cortiça",
     "Par de descansos em cortiça aglomerada, resistente a 220 °C e leve como papel.",
     "Cortiça aglomerada natural|Resistente até 220 graus|20 cm de diâmetro|Par de duas unidades",
     120, 150, 4.4, 96, "mesa", 70),

    # --------------------------------------------------------------- cozinha
    ("coz-tabua-cumaru", "Tábua de Corte Cumaru",
     "Tábua de topo em cumaru, madeira tão densa que não marca a faca nem absorve odor.",
     "Cumaru maciço de topo|Canaleta para suco|40 x 28 x 4 cm|Pés de silicone antiderrapante",
     460, 540, 4.9, 78, "cozinha", 20),
    ("coz-potes-vidro", "Trio de Potes Vidro Reciclado",
     "Três potes herméticos de vidro reciclado com tampa de bambu e vedação de silicone.",
     "Vidro reciclado|Tampa em bambu com anel de silicone|500, 900 e 1400 ml|Vedação hermética",
     290, 350, 4.7, 124, "cozinha", 40),
    ("coz-utensilios-louro", "Jogo de Utensílios Louro",
     "Cinco utensílios torneados em louro, madeira que não transfere gosto nem risca panela.",
     "Louro torneado à mão|Cinco peças|Acabamento em óleo de linhaça|Não risca antiaderente",
     240, None, 4.6, 65, "cozinha", 35),
    ("coz-avental-indigo", "Avental Índigo Natural",
     "Avental de algodão pesado tingido em índigo natural, que desbota com graça e não com mancha.",
     "Algodão pesado 280 g/m²|Índigo natural fermentado|Alça ajustável no pescoço|Bolso duplo frontal",
     210, 260, 4.5, 47, "cozinha", 28),
    ("coz-moedor-sabao", "Moedor Pedra Sabão",
     "Pilão e socador em pedra sabão, peso suficiente para quebrar especiaria sem esforço.",
     "Pedra sabão maciça|Pilão de 14 cm|Socador no mesmo material|Curado para uso alimentar",
     260, 320, 4.8, 33, "cozinha", 18),
    ("coz-pano-tear", "Pano de Prato em Tear",
     "Par de panos tecidos em tear manual com algodão cru — absorve mais a cada lavagem.",
     "Algodão cru em tear manual|Par de duas unidades|50 x 70 cm|Alça para pendurar",
     140, 170, 4.6, 102, "cozinha", 55),

    # ------------------------------------------------------------- decoracao
    ("dec-espelho-freijo", "Espelho Orgânico Freijó",
     "Espelho de contorno irregular com moldura em freijó curvado a vapor, sem emenda.",
     "Freijó curvado a vapor|Contorno orgânico sem repetição|70 x 90 cm|Pendura na vertical ou horizontal",
     1680, 1980, 4.9, 27, "decoracao", 9),
    ("dec-vaso-barro-cru", "Vaso Barro Cru Alto",
     "Vaso de piso em barro cru sem esmalte, que escurece com o tempo e ganha pátina.",
     "Barro cru sem esmalte|Torneado à mão|28 cm de diâmetro x 55 cm|Pátina natural com o uso",
     580, None, 4.7, 42, "decoracao", 15),
    ("dec-cesto-bananeira", "Cesto Fibra de Bananeira",
     "Cesto de boca larga em fibra de bananeira, resíduo agrícola que viraria descarte.",
     "Fibra de bananeira aproveitada|Trama fechada|40 cm de diâmetro x 35 cm|Alças laterais embutidas",
     320, 390, 4.6, 58, "decoracao", 26),
    ("dec-painel-macrame", "Painel Macramê de Parede",
     "Painel de parede em macramê de algodão cru sobre bastão de bambu, com três alturas de franja.",
     "Algodão cru em macramê|Bastão de bambu de 90 cm|Altura total de 140 cm|Nó trabalhado à mão",
     690, 820, 4.8, 21, "decoracao", 11),
    ("dec-escultura-sabao", "Escultura Pedra Sabão Curva",
     "Peça escultórica esculpida em bloco único de pedra sabão, acabamento polido à mão.",
     "Pedra sabão de bloco único|Polimento manual|24 x 16 x 10 cm|Peça assinada pelo artesão",
     740, None, 5.0, 8, "decoracao", 4),
    ("dec-mandala-palha", "Mandala Palha de Carnaúba",
     "Mandala de parede em palha de carnaúba trançada em espiral, com 60 cm de diâmetro.",
     "Palha de carnaúba do Piauí|Trançado em espiral|60 cm de diâmetro|Estrutura interna de bambu",
     420, 500, 4.7, 34, "decoracao", 19),

    # ------------------------------------------------------------ iluminacao
    ("ilu-pendente-buriti", "Pendente Palha de Buriti",
     "Cúpula de palha de buriti que filtra a luz em desenho rendado no teto e nas paredes.",
     "Palha de buriti trançada|Soquete E27 em porcelana|50 cm de diâmetro|Cabo têxtil de 1,5 m",
     1240, 1480, 4.9, 53, "iluminacao", 13),
    ("ilu-abajur-ceramica", "Abajur Cerâmica Fosca",
     "Base de cerâmica fosca torneada à mão com cúpula de linho cru.",
     "Cerâmica torneada à mão|Cúpula em linho cru|Altura total de 48 cm|Interruptor no cabo",
     780, 920, 4.7, 36, "iluminacao", 17),
    ("ilu-luminaria-taboa", "Luminária de Piso Taboa",
     "Luminária de piso com fuste em eucalipto e cúpula cilíndrica em taboa trançada.",
     "Taboa trançada manualmente|Fuste em eucalipto certificado|Altura de 150 cm|Pedal de acionamento",
     1890, None, 4.8, 18, "iluminacao", 6),
    ("ilu-arandela-reciclado", "Arandela Vidro Reciclado",
     "Arandela de vidro reciclado soprado à boca, com acabamento em latão escovado.",
     "Vidro reciclado soprado à boca|Acabamento em latão escovado|18 x 22 cm|Para lâmpada G9",
     540, 650, 4.5, 25, "iluminacao", 21),
    ("ilu-casticais-sabao", "Trio de Castiçais Pedra Sabão",
     "Três castiçais de alturas diferentes, esculpidos em pedra sabão polida.",
     "Pedra sabão polida|Três alturas: 8, 14 e 20 cm|Para vela de 2,2 cm|Base com feltro",
     380, 450, 4.8, 49, "iluminacao", 24),
    ("ilu-lanterna-bambu", "Lanterna de Jardim Bambu",
     "Lanterna de chão em bambu tratado, para vela ou lâmpada solar, resistente a chuva.",
     "Bambu tratado para exterior|Compatível com vela ou solar|20 x 20 x 45 cm|Tratamento contra cupim",
     290, None, 4.4, 31, "iluminacao", 30),

    # --------------------------------------------------------------- tapetes
    ("tap-sisal-natural", "Tapete Sisal Natural",
     "Tapete de sisal entrançado em espinha de peixe, o mais resistente para área de passagem.",
     "Sisal natural da Bahia|Trama espinha de peixe|200 x 290 cm|Debrum em algodão cru",
     1480, 1780, 4.7, 64, "tapetes", 10),
    ("tap-croche-algodao", "Tapete Crochê Algodão",
     "Tapete redondo em crochê de algodão reciclado, feito por cooperativa de costureiras.",
     "Algodão reciclado|Crochê manual em ponto alto|180 cm de diâmetro|Lavável em máquina",
     740, 890, 4.8, 72, "tapetes", 14),
    ("tap-passadeira-juta", "Passadeira Juta Trançada",
     "Passadeira de corredor em juta trançada em trança grossa, com acabamento virado à mão.",
     "Juta natural|Trança grossa|70 x 240 cm|Acabamento virado à mão",
     480, None, 4.5, 43, "tapetes", 22),
    ("tap-la-serrana", "Tapete Lã Serrana",
     "Tapete de lã virgem batida no tear, denso o bastante para isolar o piso frio.",
     "Lã virgem batida em tear|Tecido no Sul do país|160 x 230 cm|Avesso em algodão cru",
     2290, 2690, 4.9, 22, "tapetes", 7),
    ("tap-capacho-coco", "Capacho Fibra de Coco",
     "Capacho de fibra de coco prensada, o único que realmente tira terra do sapato.",
     "Fibra de coco prensada|Base em PVC reciclado|40 x 60 cm|Para área coberta",
     130, 160, 4.6, 118, "tapetes", 65),
    ("tap-kilim-reciclado", "Kilim Algodão Reciclado",
     "Kilim plano tecido com retalho de algodão reciclado da indústria têxtil, em tons terrosos.",
     "Algodão reciclado de retalho|Tecelagem plana reversível|140 x 200 cm|Tons terrosos variados",
     890, 1060, 4.7, 37, "tapetes", 16),

    # ----------------------------------------------------------- organizacao
    ("org-caixa-palha", "Caixa Organizadora Palha",
     "Caixa com tampa em palha de tala trançada, dimensionada para prateleira de estante.",
     "Palha de tala trançada|Tampa encaixada|35 x 25 x 18 cm|Forro interno em algodão",
     280, 340, 4.6, 59, "organizacao", 34),
    ("org-cabideiro-freijo", "Cabideiro de Parede Freijó",
     "Régua de parede em freijó com cinco ganchos torneados no mesmo bloco de madeira.",
     "Freijó maciço|Cinco ganchos torneados|80 cm de comprimento|Parafusos e buchas inclusos",
     390, None, 4.8, 46, "organizacao", 25),
    ("org-sapateira-bambu", "Sapateira Bambu Três Níveis",
     "Sapateira de três prateleiras em bambu laminado, que ventila o calçado em vez de abafar.",
     "Bambu laminado|Três prateleiras ventiladas|70 x 30 x 55 cm|Montagem sem ferramenta",
     460, 550, 4.5, 68, "organizacao", 20),
    ("org-nicho-demolicao", "Nicho Madeira de Demolição",
     "Nicho de parede em madeira de demolição, com furação oculta e prateleira interna.",
     "Madeira de demolição|Furação oculta|45 x 20 x 45 cm|Prateleira interna fixa",
     520, 620, 4.7, 31, "organizacao", 12),
    ("org-organizador-cortica", "Organizador de Mesa Cortiça",
     "Bandeja de cortiça com três divisórias para chave, carteira e o que mais se perde.",
     "Cortiça natural aglomerada|Três divisórias|28 x 18 x 4 cm|Base antiderrapante",
     160, 195, 4.4, 84, "organizacao", 48),
    ("org-cesto-dupla-face", "Cesto Dupla Face Algodão",
     "Cesto de corda de algodão que vira do lado de dentro para fora, mudando de cor.",
     "Corda de algodão reciclado|Reversível em duas cores|38 cm de diâmetro x 40 cm|Estrutura flexível",
     240, None, 4.6, 77, "organizacao", 38),

    # ---------------------------------------------------------------- aromas
    ("aro-vela-breu", "Vela Cera Vegetal Breu Branco",
     "Vela de cera de coco e soja com breu branco da Amazônia, resina usada em defumação há séculos.",
     "Cera de coco e soja|Breu branco amazônico|Pavio de algodão, 45 h|Pote de vidro reaproveitável",
     180, 220, 4.9, 156, "aromas", 60),
    ("aro-difusor-capim", "Difusor Capim-Limão",
     "Difusor de varetas com óleo essencial de capim-limão puro, sem álcool nem fixador sintético.",
     "Óleo essencial puro|Sem álcool ou fixador sintético|250 ml, até 4 meses|Oito varetas de rattan",
     210, 250, 4.7, 98, "aromas", 44),
    ("aro-incenso-breu", "Incenso Breu Branco",
     "Bastões de breu branco prensado à mão, colhido sem derrubar a árvore.",
     "Breu branco de coleta manejada|Prensado à mão|Vinte bastões|Base de cerâmica inclusa",
     95, None, 4.8, 134, "aromas", 80),
    ("aro-home-spray-cumaru", "Home Spray Cumaru",
     "Spray de ambiente com fava de cumaru e cedro, em base de água sem propelente.",
     "Fava de cumaru e cedro|Base aquosa sem propelente|200 ml|Frasco de vidro âmbar",
     150, 185, 4.6, 71, "aromas", 52),
    ("aro-sache-erva-doce", "Sachê Erva-Doce",
     "Trio de sachês de linho cru com erva-doce e alfazema para gaveta e armário.",
     "Linho cru|Erva-doce e alfazema|Três unidades|Recarregável",
     85, 105, 4.5, 62, "aromas", 90),
    ("aro-vela-priprioca", "Vela Três Pavios Priprioca",
     "Vela grande de três pavios com priprioca, raiz amazônica de aroma terroso e amadeirado.",
     "Cera de coco e soja|Priprioca do Pará|Três pavios, até 70 h|Pote de cerâmica torneada",
     340, 410, 5.0, 43, "aromas", 28),

    # ---------------------------------------------------------------- jardim
    ("jar-cachepo-cimento", "Cachepô Cimento Queimado",
     "Cachepô de cimento queimado com dreno de verdade — a maioria do mercado não tem.",
     "Cimento queimado|Dreno funcional com prato|30 cm de diâmetro x 28 cm|Para interior e exterior",
     290, 350, 4.7, 88, "jardim", 32),
    ("jar-regador-cobre", "Regador Cobre Martelado",
     "Regador de cobre martelado à mão, com bico longo que alcança o fundo do vaso.",
     "Cobre martelado à mão|Bico longo de precisão|1,8 litro|Ganha pátina com o tempo",
     480, 580, 4.8, 39, "jardim", 15),
    ("jar-trelica-bambu", "Treliça Bambu Extensível",
     "Treliça de bambu articulada que abre de 60 cm a 180 cm para guiar trepadeira.",
     "Bambu tratado articulado|Extensível de 60 a 180 cm|Altura de 180 cm|Tratamento para exterior",
     220, None, 4.5, 54, "jardim", 26),
    ("jar-banco-eucalipto", "Banco de Jardim Eucalipto",
     "Banco de dois lugares em eucalipto autoclavado, resiste a sol e chuva sem verniz.",
     "Eucalipto autoclavado|Dispensa verniz|120 x 45 x 80 cm|Montagem com ferragem inox",
     1340, 1590, 4.6, 23, "jardim", 9),
    ("jar-composteira", "Composteira Doméstica Três Caixas",
     "Composteira de minhocas em três níveis, dá conta do resto orgânico de até quatro pessoas.",
     "Três caixas empilháveis|Para até quatro pessoas|Torneira para chorume|Manual e minhocas inclusos",
     540, 650, 4.9, 107, "jardim", 18),
    ("jar-vaso-autoirrigavel", "Vaso Autoirrigável Barro",
     "Vaso de barro com reservatório interno que rega por capilaridade por até dez dias.",
     "Barro poroso natural|Reservatório interno|22 cm de diâmetro|Autonomia de até 10 dias",
     260, None, 4.7, 66, "jardim", 29),

    # ------------------------------------------------------------ escritorio
    ("esc-escrivaninha-tauari", "Escrivaninha Tauari",
     "Escrivaninha de tampo limpo em tauari com gaveta rasa e passagem de cabo embutida.",
     "Tauari de manejo certificado|Gaveta rasa com corrediça de madeira|120 x 60 x 75 cm|Passagem de cabo embutida",
     2890, 3400, 4.8, 17, "escritorio", 8),
    ("esc-porta-lapis-sabao", "Porta-Lápis Pedra Sabão",
     "Porta-lápis cilíndrico em pedra sabão, pesado o bastante para não tombar.",
     "Pedra sabão maciça|Interior polido|9 cm de diâmetro x 11 cm|Base com feltro",
     120, 145, 4.6, 57, "escritorio", 42),
    ("esc-banqueta-freijo", "Banqueta Ajustável Freijó",
     "Banqueta de altura ajustável por pino de madeira, sem mecanismo a gás para quebrar.",
     "Freijó maciço|Ajuste por pino de madeira|Altura de 55 a 70 cm|Assento côncavo esculpido",
     1180, 1390, 4.7, 26, "escritorio", 11),
    ("esc-luminaria-latao", "Luminária de Mesa Latão",
     "Luminária articulada em latão maciço com cúpula direcionável e peso de base generoso.",
     "Latão maciço escovado|Braço articulado em dois pontos|Alcance de 55 cm|Para lâmpada E14",
     690, 830, 4.8, 34, "escritorio", 19),
    ("esc-caderno-semente", "Caderno Papel Semente",
     "Caderno de capa plantável: enterre a capa depois de usar e nasce manjericão.",
     "Papel reciclado com semente de manjericão|160 páginas sem pauta|A5 com costura aparente|Capa plantável",
     75, 90, 4.5, 149, "escritorio", 100),
    ("esc-apoio-cumaru", "Apoio de Notebook Cumaru",
     "Apoio inclinado em cumaru que levanta a tela à altura dos olhos e ventila a base.",
     "Cumaru maciço|Inclinação de 15 graus|Até 16 polegadas|Vão de ventilação inferior",
     340, None, 4.7, 61, "escritorio", 24),
]

ARIAL = "Arial"
HEADER_FILL = PatternFill("solid", fgColor="C23B2B")
FILL_ME_FILL = PatternFill("solid", fgColor="FFF2A8")
NOTE_FILL = PatternFill("solid", fgColor="F8EFDE")

WIDTHS = {
    "sku": 24, "name": 34, "imageUrl": 30, "description": 62, "features": 70,
    "price": 9, "mrp": 9, "rating": 8, "reviewCount": 13, "category": 14, "stock": 8,
}


def build() -> Workbook:
    wb = Workbook()

    # A aba de produtos é a PRIMEIRA e a ativa de propósito: "Salvar como CSV"
    # exporta apenas a aba ativa, e é esta que tem que sair.
    ws = wb.active
    ws.title = "produtos"

    ws.append(COLUMNS)
    for cell in ws[1]:
        cell.font = Font(name=ARIAL, bold=True, color="FFFFFF", size=11)
        cell.fill = HEADER_FILL
        cell.alignment = Alignment(vertical="center")
    # A coluna A é a que exige ação sua: cada sku é o nome do arquivo a subir.
    ws["A1"].fill = FILL_ME_FILL
    ws["A1"].font = Font(name=ARIAL, bold=True, color="7A2318", size=11)

    for row in P:
        sku, name, desc, features, price, mrp, rating, reviews, category, stock = row
        ws.append([
            sku, name, image_url(sku), desc, features,
            price, mrp, rating, reviews, category, stock,
        ])

    sku_col = COLUMNS.index("sku") + 1

    for row_idx in range(2, ws.max_row + 1):
        for col_idx in range(1, len(COLUMNS) + 1):
            cell = ws.cell(row=row_idx, column=col_idx)
            cell.font = Font(name=ARIAL, size=10)
            cell.alignment = Alignment(vertical="top", wrap_text=col_idx in (4, 5))
        ws.cell(row=row_idx, column=sku_col).fill = FILL_ME_FILL

    for name, width in WIDTHS.items():
        ws.column_dimensions[get_column_letter(COLUMNS.index(name) + 1)].width = width

    ws.freeze_panes = "A2"
    ws.auto_filter.ref = f"A1:{get_column_letter(len(COLUMNS))}{ws.max_row}"

    build_instructions(wb)
    wb.active = 0
    return wb


def build_instructions(wb: Workbook) -> None:
    ws = wb.create_sheet("como usar")
    ws.column_dimensions["A"].width = 22
    ws.column_dimensions["B"].width = 96

    def head(text: str) -> None:
        ws.append([text, None])
        cell = ws.cell(row=ws.max_row, column=1)
        cell.font = Font(name=ARIAL, bold=True, size=12, color="7A2318")
        cell.fill = NOTE_FILL

    def line(label: str, text: str) -> None:
        ws.append([label, text])
        ws.cell(row=ws.max_row, column=1).font = Font(name=ARIAL, bold=True, size=10)
        ws.cell(row=ws.max_row, column=2).font = Font(name=ARIAL, size=10)
        ws.cell(row=ws.max_row, column=2).alignment = Alignment(wrap_text=True, vertical="top")

    head("O QUE VOCÊ PRECISA FAZER")
    line("Nada na planilha", "As 11 colunas estão preenchidas e validadas, imageUrl incluída. Não precisa editar célula nenhuma.")
    line("Subir as imagens", "Suba cada imagem no Cloudinary com o nome EXATO da coluna sku (destacada em amarelo), sem extensão no nome do public_id. Ex.: o arquivo de 'mob-banco-taboa' pode ser mob-banco-taboa.png — o Cloudinary remove o .png e o public_id fica mob-banco-taboa, que é o que a URL espera.")
    line("Na RAIZ, sem pasta", "Suba direto na Media Library, fora de qualquer pasta. Dentro de uma pasta o public_id vira 'pasta/mob-banco-taboa' e as 72 URLs quebram.")
    line("Tamanho ideal", "Suba quadrado e grande, por volta de 1200 x 1200. A mesma URL serve o card da home (quadrado pequeno) e a página do produto (grande), então vale subir no maior tamanho e deixar o Cloudinary reduzir.")
    line("Antes de subir", "Produto sem imagem no Cloudinary mostra espaço vazio na loja — a linha importa normalmente, porque a URL é válida mesmo que o arquivo ainda não exista lá.")

    ws.append([])
    head("AO EXPORTAR PARA CSV")
    line("Separador decimal", "O Excel em português exporta número com VÍRGULA, e a validação recusa '1890,00'. Por isso todos os preços aqui são inteiros, sem centavos — sem casa decimal não há vírgula para dar problema.")
    line("Atenção em rating", "É a única coluna com decimal (ex.: 4.8). Se a importação acusar erro de número em rating, troque os valores por inteiros (4 ou 5) ou exporte pelo Google Sheets, que sempre usa ponto.")
    line("Codificação", "Salve como 'CSV UTF-8'. Sem isso, acento vira caractere estranho no site.")
    line("Aba exportada", "'Salvar como CSV' exporta só a aba ativa. Mantenha 'produtos' selecionada ao salvar — esta aba de instruções não deve ir para o arquivo.")

    ws.append([])
    head("REGRAS DE CADA COLUNA")
    line("sku", "Obrigatório e único. Vira o id do produto no banco (minúsculo, espaço troca por hífen). Reimportar o mesmo sku ATUALIZA o produto em vez de duplicar.")
    line("name", "Obrigatório.")
    line("imageUrl", "Obrigatório, precisa ser URL válida. Já preenchida com o padrão do Cloudinary mfy6wood + f_auto,q_auto, que entrega o PNG convertido para WebP/AVIF sozinho.")
    line("description", "Obrigatório. Aparece na página do produto.")
    line("features", "Obrigatório. Separe cada característica com | (barra vertical). Vira lista na página do produto.")
    line("price", "Obrigatório, maior que zero. Use ponto como decimal, ou inteiro.")
    line("mrp", "Opcional: o preço 'de', usado para calcular o selo de desconto. Se preenchido, tem que ser MAIOR OU IGUAL a price. Pode ficar em branco.")
    line("rating", "Obrigatório, de 0 a 5. Aceita decimal.")
    line("reviewCount", "Obrigatório, inteiro, zero ou mais.")
    line("category", "NÃO deixe em branco. Vazia, o sistema grava o texto literal 'null' como categoria e cria um card de categoria chamado 'null' na home.")
    line("stock", "Opcional, inteiro, zero ou mais. Pode ficar em branco.")

    ws.append([])
    head("LINHA DE EXEMPLO (formato esperado)")
    ws.append(["coluna", "valor"])
    ws.cell(row=ws.max_row, column=1).font = Font(name=ARIAL, bold=True, size=10)
    ws.cell(row=ws.max_row, column=2).font = Font(name=ARIAL, bold=True, size=10)
    exemplo = [
        ("sku", "mob-banco-taboa"),
        ("name", "Banco Taboa Trançado"),
        ("imageUrl", "https://res.cloudinary.com/mfy6wood/image/upload/f_auto,q_auto/mob-banco-taboa"),
        ("description", "Banco baixo com assento trançado à mão em taboa."),
        ("features", "Taboa trançada manualmente|Estrutura em eucalipto|110 x 38 cm"),
        ("price", "1890"),
        ("mrp", "2290"),
        ("rating", "4.8"),
        ("reviewCount", "37"),
        ("category", "moveis"),
        ("stock", "8"),
    ]
    for label, value in exemplo:
        line(label, value)

    ws.append([])
    head("CATEGORIAS USADAS")
    cats = sorted({row[8] for row in P})
    line("12 categorias", ", ".join(cats))
    line("Por que importam", "Cada categoria vira um card na home, com a imagem do PRIMEIRO produto dela. Mantenha minúsculo e sem acento: o valor também vai para a URL (/?categoria=moveis).")


if __name__ == "__main__":
    workbook = build()
    out = "catalogo/the-bush-catalogo.xlsx"
    workbook.save(out)
    print(f"{len(P)} produtos gravados em {out}")
    print(f"categorias: {len(sorted({r[8] for r in P}))}")
    print(f"skus unicos: {len({r[0] for r in P})}")
