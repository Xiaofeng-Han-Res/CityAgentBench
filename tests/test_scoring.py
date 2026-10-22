"""Regression cases for interpretation of answers and actual arrival."""
import copy
import unittest

from cityagentbench.scoring import score, text_score


class ReferenceScoringTests(unittest.TestCase):
    def test_unknown_semantics_remain_pending(self):
        truth = {'kind': 'semantic', 'accepted': ['empty'], 'rejected': ['occupied'],
                 'rubric': 'The visible bench has no occupant.'}
        self.assertTrue(text_score(' Empty! ', truth, {})['passed'])
        self.assertFalse(text_score('occupied', truth, {})['passed'])
        self.assertIsNone(text_score('Nobody is sitting there.', truth, {})['passed'])

    def test_box_is_bound_to_observation(self):
        truth = {'kind': 'box', 'reference_initial_boxes': [[0.1, 0.2, 0.3, 0.4]]}
        answer = {'box': [0.1, 0.2, 0.3, 0.4], 'observation_id': 'obs_000'}
        observations = {'obs_000': {'sha256': 'initial'}, 'obs_001': {'sha256': 'later'}}
        self.assertTrue(text_score(answer, truth, observations)['passed'])
        answer['observation_id'] = 'obs_001'
        self.assertFalse(text_score(answer, truth, observations)['passed'])
        answer['observation_id'] = 'obs_000'
        answer['box'] = [float('nan'), 0.2, 0.3, 0.4]
        self.assertFalse(text_score(answer, truth, observations)['passed'])

    def test_integer_contract(self):
        truth = {'kind': 'integer', 'answer': 3}
        self.assertTrue(text_score(3, truth, {})['passed'])
        self.assertFalse(text_score('3 items', truth, {})['passed'])
        self.assertFalse(text_score('3.0', truth, {})['passed'])

    def fixture(self):
        question = {'task': {'level': 'L2'}, 'truth': {'kind': 'arrival_only'},
                    'arrival': {'center_ground_cm': [0, 0, 0], 'horizontal_radius_m': 1,
                                'vertical_tolerance_m': 0.1, 'minimum_distance_m': 5}}
        result = {'final_state': {'robot': {'position_cm': [0, 0, 2]}}, 'distance_m': 5,
                  'start_state': {'robot': {'position_cm': [500, 0, 2]}}, 'steps': [],
                  'observations': [], 'answer': 'I arrived', 'termination': 'stop'}
        return question, result

    def test_arrival_requires_movement_and_native_position(self):
        question, result = self.fixture()
        self.assertTrue(score(question, result)['success'])
        unmoved = copy.deepcopy(result)
        unmoved['distance_m'] = 0
        self.assertFalse(score(question, unmoved)['success'])
        outside = copy.deepcopy(result)
        outside['final_state']['robot']['position_cm'] = [200, 0, 2]
        self.assertFalse(score(question, outside)['success'])

    def test_arrival_does_not_override_missing_information(self):
        question, result = self.fixture()
        question['truth'] = {'kind': 'integer', 'answer': 3}
        result['answer'] = 2
        self.assertFalse(score(question, result)['success'])
        result['answer'] = 3
        self.assertTrue(score(question, result)['success'])
        result['termination'] = 'time_budget'
        self.assertFalse(score(question, result)['success'])


if __name__ == '__main__':
    unittest.main()
