import modal

app = modal.App("dentor-helsinki")


def download_model():
    from transformers import AutoModelForSeq2SeqLM, AutoTokenizer
    print("Downloading Helsinki translation model into image...")
    model_id = "medodeyaa/dentor-helsinki"
    AutoTokenizer.from_pretrained(model_id)
    AutoModelForSeq2SeqLM.from_pretrained(model_id)


image = (
    modal.Image.debian_slim(python_version="3.10")
    .pip_install(
        "transformers>=4.40.0",
        "torch",
        "fastapi",
        "pydantic",
        "sentencepiece",
        "accelerate>=0.26.0",
        "protobuf",
    )
    .run_function(download_model)
)


@app.cls(image=image, gpu="T4")
class HelsinkiTranslator:

    @modal.enter()
    def load_model(self):
        from transformers import AutoModelForSeq2SeqLM, AutoTokenizer
        import torch
        print("Loading Helsinki translator onto T4 GPU...")
        model_id = "medodeyaa/dentor-helsinki"
        self.device = "cuda"
        self.tokenizer = AutoTokenizer.from_pretrained(model_id)
        # float32 for T4 stability (Helsinki-NLP models are small, ~300MB)
        self.model = AutoModelForSeq2SeqLM.from_pretrained(
            model_id,
            torch_dtype=torch.float32,
        ).to(self.device)
        self.model.eval()
        print("Helsinki translator loaded successfully!")

    @modal.fastapi_endpoint(method="POST")
    def translate(self, request: dict):
        import torch
        text = request.get("inputs", "").strip()
        if not text:
            return {"error": "No text provided in 'inputs' field."}

        # Helsinki-NLP has 512 token limit
        inputs = self.tokenizer(
            text,
            return_tensors="pt",
            max_length=512,
            truncation=True,
        ).to(self.device)

        with torch.no_grad():
            outputs = self.model.generate(
                **inputs,
                max_new_tokens=512,
                num_beams=4,
                early_stopping=True,
                no_repeat_ngram_size=3,
            )

        translation = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
        print(f"Translated: {len(text)} chars → {len(translation)} chars")
        return {"translation_text": translation}
