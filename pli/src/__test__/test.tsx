import { render } from "@testing-library/react";
import Home from "../routes/home";

jest.mock("../loadenv", () => ({backurl : "https://localhost"}));

jest.mock("react-router-dom", () => ({
    useNavigate: () => jest.fn(),
}));

describe("Home", () => {
    test("renders correctly", () => {
        const { container } = render(<Home />);
        expect(container).toMatchSnapshot();
    });
});