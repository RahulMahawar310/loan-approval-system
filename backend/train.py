"""Neural part: trains an MLP classifier and saves it as model.pkl."""
import joblib
from sklearn.model_selection import train_test_split
from sklearn.neural_network import MLPClassifier
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

from data_gen import FEATURES, make_dataset

df = make_dataset()
X_train, X_test, y_train, y_test = train_test_split(
    df[FEATURES], df["approved"], test_size=0.2, random_state=42
)

model = make_pipeline(
    StandardScaler(),
    MLPClassifier(hidden_layer_sizes=(32, 16), max_iter=600, random_state=42),
)
model.fit(X_train, y_train)
print("Test accuracy:", round(model.score(X_test, y_test), 3))

joblib.dump(model, "model.pkl")
print("Saved model.pkl")
