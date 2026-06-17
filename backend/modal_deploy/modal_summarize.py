import modal
from pydantic import BaseModel

app = modal.App("dentor-biobart")


def download_model():
    from transformers import AutoModelForSeq2SeqLM, AutoTokenizer
    print("Downloading BioBART model into image...")
    model_id = "medodeyaa/dentor-biobart"
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
class BioBartSummarizer:

    @modal.enter()
    def load_model(self):
        from transformers import AutoModelForSeq2SeqLM, AutoTokenizer
        import torch
        print("Loading BioBART onto T4 GPU...")
        model_id = "medodeyaa/dentor-biobart"
        self.device = "cuda"
        self.tokenizer = AutoTokenizer.from_pretrained(model_id)
        # Load in float32 for T4 stability (BioBART is small enough)
        self.model = AutoModelForSeq2SeqLM.from_pretrained(
            model_id,
            torch_dtype=torch.float32,
        ).to(self.device)
        self.model.eval()
        print("BioBART loaded successfully!")

    @modal.fastapi_endpoint(method="POST")
    def summarize(self, request: dict):
        import torch
        text = request.get("inputs", "").strip()
        if not text:
            return {"error": "No text provided in 'inputs' field."}

        # Chunk long text — BioBART has 1024 token limit
        max_input_chars = 2500
        if len(text) > max_input_chars:
            text = text[:max_input_chars]

        inputs = self.tokenizer(
            text,
            return_tensors="pt",
            max_length=1024,
            truncation=True,
        ).to(self.device)

        with torch.no_grad():
            outputs = self.model.generate(
                **inputs,
                max_new_tokens=250,
                min_new_tokens=40,
                do_sample=False,
                num_beams=4,
                length_penalty=1.0,
            )

        summary = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
        # Strip echoed prefix if the model repeats input
        for prefix in ["summarize:", "summarize :", "summary:"]:
            if summary.lower().startswith(prefix):
                summary = summary[len(prefix):].strip()
        print(f"Input: {len(text)} chars → Summary: {len(summary)} chars")
        return {"summary_text": summary}
